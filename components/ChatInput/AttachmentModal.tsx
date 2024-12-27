"use client"

import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { File as FileIcon, Loader2 } from "lucide-react";
import { FaFilePdf, FaRegTrashCan } from "react-icons/fa6";
import { v4 } from "uuid";
import toast from "react-hot-toast";
import Typography from "../Typography";
import { Form } from "../ui/form";
import { Button } from "../ui/button";
import { useUser } from "@/hooks/useUser";
import { imageCompressor } from "@/utils/imageCompression";
import { supabaseBrowserClient } from "@/utils/supabase/supabaseBrowserClient";
import { cn } from "@/lib/utils";

const ACCEPTED_FILES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

interface Props {
  workspaceId: string;
  channelId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const FormSchema = z.object({
  file: z
    .any()
    .refine((file) => !!file && file instanceof File, { message: "Please select an image or pdf file" })
    .refine((file: File) => file?.size < 5 * 1024 * 1024, { message: "File size must be less than 5MB" })
    .refine((file: File) => ACCEPTED_FILES.includes(file?.type), { message: "File type must be jpeg, jpg, png, webp or pdf" })
});

type FormType = z.infer<typeof FormSchema>;

const AttachmentModal: FC<Props> = ({ workspaceId, channelId, isOpen, setIsOpen }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {user} = useUser();

  const formProps = useForm<FormType>({
    resolver: zodResolver(FormSchema),
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

  
  /**
   * Enviar el archivo al bucket de supabase
   */
  const onSubmitHandler = async (values: FormType) => {
    if (!user) {
      return;
    }

    try {
      setIsUploading(true);

      const supabase = supabaseBrowserClient;

      // Extraer la extensión del archivo
      const extension = values.file.name.split(".")[values.file.name.split(".").length - 1]; 

      // Generar un nombre unico para el archivo
      const fileUniqueName = `${v4()}_${Date.now()}.${extension}`;

      const {data: fileUploadData, error} = await supabase.storage
      .from("messages-attachments")
      .upload(`chat/channel_${channelId}/attachments/${fileUniqueName}`, values.file, {
        cacheControl: "3600",
        upsert: false
      });

      if (error) {
        throw error;
      }

      console.log(fileUploadData);

      // Crear el mensaje en la base de datos con el path del archivo
      const {data: messageData, error: messageError} = await supabase
      .from("messages")
      .insert({
        workspace_id: workspaceId,
        channel_id: channelId,
        sender_id: user.id,
        attachment_url: fileUploadData.fullPath,
      });

      if (messageError) {
        throw messageError;
      }
    
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
            className={cn("flex flex-col justify-center items-center gap-3 w-full h-full p-4 border border-dashed border-blue-700 rounded-md hover:border-blue-500 transition-colors overflow-hidden", formProps.formState.errors.file && "border-red-500")}
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile && selectedFileType === "pdf" &&
            <>
              <FaFilePdf className="w-14 h-14" />
              <Typography
                className="max-w-full text-neutral-300 font-medium truncate"
                variant="p"
                text={selectedFile.name}
              />
            </>
            }

            {isProcessingImage &&
              <Loader2 className="w-8 h-8 animate-spin" />
            }

            {selectedFile && selectedImagePreview &&
              <img
                ref={imageRef}
                className="block w-full h-full object-contain object-center"
                src={selectedImagePreview}
                alt={selectedFile.name}
              />
            }

            {!selectedFile && !isProcessingImage &&
              <>
                <FileIcon className="w-14 h-14" />
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
              disabled={isUploading}
              onClick={() => {
                setSelectedFile(null);
                setSelectedFileType("");
                setSelectedImagePreview(null);
                formProps.reset();
              }}
            >
              <FaRegTrashCan className="w-full h-full" />
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