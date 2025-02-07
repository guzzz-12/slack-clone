"use client"

import { ChangeEvent, DragEvent, FC, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { File as FileIcon, Loader2 } from "lucide-react";
import { FaFilePdf, FaRegTrashCan } from "react-icons/fa6";
import toast from "react-hot-toast";
import Typography from "../Typography";
import { Form } from "../ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useUser } from "@/hooks/useUser";
import { imageCompressor } from "@/utils/imageCompression";
import { MessageAttachmentSchema } from "@/utils/formSchemas";
import { cn } from "@/lib/utils";

const ACCEPTED_FILES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

interface Props {
  apiUrl: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

type FormType = z.infer<typeof MessageAttachmentSchema>;

const AttachmentModal: FC<Props> = ({ apiUrl, isOpen, setIsOpen }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);

  const {user} = useUser();

  const formProps = useForm<FormType>({
    resolver: zodResolver(MessageAttachmentSchema),
    defaultValues: {
      file: undefined
    }
  });

  // Limpiar los estados al cerrar el modal
  useEffect(() => {
    return () => {
      setTimeout(() => {
        setSelectedFile(null);
        setSelectedFileType("");
        setIsProcessingImage(false);
        setSelectedImagePreview(null);
        formProps.reset();
      }, 1000);
    }
  }, [isOpen]);
  

  /**
   * Manejar el evento change del input selector de archivos
   */
  const onFilePickHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    setSelectedFile(null);
    setSelectedImagePreview(null);
    formProps.reset();
    formProps.clearErrors("file");

    // Validar el tamaño del archivo
    if(files && files[0].size > 5 * 1024 * 1024) {
      formProps.setError("file", {message: "File size must be less than 5MB"});

      // Limpiar el ref del input luego de seleccionar la imagen
      // para restablecer el evento change del input.
      if(fileInputRef.current) {
        fileInputRef.current.value = ""
      };

      return false;
    }

    // Validar las imágenes
    if(files && files[0].type.startsWith("image")) {
      setIsProcessingImage(true);

      const file = files[0];
      const imageBase64 = await imageCompressor(file, "base64") as string;

      setSelectedFile(file);
      setSelectedFileType("image");
      setSelectedImagePreview(imageBase64);
      setIsProcessingImage(false);

      formProps.setValue("file", file);
    }
    
    // Validar el PDF
    if (files && files[0].type === "application/pdf") {
      setSelectedFile(files[0]);
      setSelectedFileType("pdf");

      formProps.setValue("file", files[0]);
    }

    formProps.trigger("file");

    // Limpiar el ref del input luego de seleccionar la imagen
    // para restablecer el evento change del input.
    if(fileInputRef.current) {
      fileInputRef.current.value = ""
    };
  };


  /** Manejar el evento drop al soltar el archivo */
  const onDropFileHandler = async (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileType = file.type;

      // Validar el tipo de archivo
      if (!ACCEPTED_FILES.includes(fileType)) {
        formProps.setError("file", {message: "File type must be jpeg, jpg, png, webp or pdf"});
        setIsDragOver(false);
        return false;
      }

      // Limpiar el state del archivo
      setSelectedFile(null);
      setSelectedImagePreview(null);
      formProps.reset();
      formProps.clearErrors("file");

      // Validar el tamaño del archivo
      if(file.size > 5 * 1024 * 1024) {
        formProps.setError("file", {message: "File size must be less than 5MB"});

        return false;
      }

      if (fileType.startsWith("image")) {
        setIsProcessingImage(true);

        const imageBase64 = await imageCompressor(file, "base64") as string;
        setSelectedImagePreview(imageBase64);
        setIsProcessingImage(false);

        setSelectedFile(file);
        setSelectedFileType("image");

      } else if (fileType === "application/pdf") {
        setSelectedFile(file);
        setSelectedFileType("pdf");
      }

      formProps.setValue("file", file);
      formProps.trigger("file");

      setIsDragOver(false);
    }
  }

  
  /**
   * Enviar el archivo al bucket de supabase
   */
  const onSubmitHandler = async (values: FormType) => {
    if (!user) {
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", values.file);

      // Enviar el attachment al backend
      await axios({
        method: "POST",
        url: apiUrl,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
    
    } catch (error: any) {
      toast.error(error.message);
      
    } finally {
      setIsUploading(false);
      setIsOpen(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (isUploading) {
          return false;
        }

        setIsOpen(isOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span id="file">
              Send attachment
            </span>
          </DialogTitle>

          <DialogDescription>
            Select an image or a pdf file (max 5MB)
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex flex-col justify-center items-center h-[50vh] p-0 overflow-hidden">
          <button
            className={cn("flex flex-col justify-center items-center gap-3 w-full h-full p-4 border border-dashed border-blue-700 rounded-md hover:border-blue-500 transition-colors overflow-hidden", formProps.formState.errors.file && "border-red-500", isDragOver && "border-blue-500 border-2 border-spacing-1")}
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              if (selectedFile) {
                e.preventDefault();
                return false;
              }

              onDropFileHandler(e);
            }}
            onDragOver={(e) => {
              if (selectedFile) return false;

              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              if (selectedFile) return false;

              e.preventDefault();
              setIsDragOver(false);
            }}
          >
            {selectedFile && selectedFileType === "pdf" &&
            <>
              <FaFilePdf className="w-14 h-14" aria-hidden/>
              <Typography
                className="max-w-full text-neutral-300 font-medium truncate"
                variant="p"
                text={selectedFile.name}
              />
            </>
            }

            {isProcessingImage &&
              <Loader2 className="w-8 h-8 animate-spin" aria-hidden />
            }

            {selectedFile && selectedImagePreview &&
              <img
                ref={imageRef}
                className="block w-full h-full object-contain object-center"
                src={selectedImagePreview}
                alt={selectedFile.name}
              />
            }

            {!selectedFile && !isProcessingImage && !isDragOver &&
              <>
                <FileIcon className="w-14 h-14" aria-hidden />
                <Typography
                  className="text-neutral-300 font-medium"
                  variant="p"
                  text="Drag and drop or select a file"
                />
              </>
            }
          </button>

          {/* Botón para eliminar el archivo seleccionado y limpiar el formulario */}
          {selectedFile &&
            <button
              className="absolute top-2 right-2 w-8 h-8 p-1 rounded-full border border-red-500 text-red-500"
              type="button"
              aria-labelledby="discard-attachment-btn-label"
              disabled={isUploading}
              onClick={() => {
                setSelectedFile(null);
                setSelectedFileType("");
                setSelectedImagePreview(null);
                formProps.reset();
              }}
            >
              <FaRegTrashCan className="w-full h-full" aria-hidden />
              <span id="discard-attachment-btn-label" hidden>
                Discard attachment
              </span>
            </button>
          }

          <Form {...formProps}>
            <form
              className="w-full"
              onSubmit={formProps.handleSubmit(onSubmitHandler)}
              noValidate
            >
              <Controller
                control={formProps.control}
                name="file"
                render={() => {
                  return (
                    <input
                      ref={fileInputRef}
                      id="file"
                      hidden
                      type="file"
                      aria-labelledby="file"
                      accept={ACCEPTED_FILES.join(", ")}
                      multiple={false}
                      disabled={isProcessingImage}
                      onChange={onFilePickHandler}
                    />
                  )
                }}
              />

              {formProps.formState.errors.file &&
                <Typography
                  className="w-full mt-1 text-sm text-left text-red-500 font-medium"
                  variant="p"
                  text={formProps.formState.errors.file.message!.toString()}
                />
              }

              <div className="flex justify-end items-center gap-2 w-full mt-4">
                <Button
                  type="submit"
                  disabled={isUploading}
                >
                  Send
                </Button>

                <Button
                  variant="ghost"
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AttachmentModal