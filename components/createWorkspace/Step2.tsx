"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFormContext } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { FaRegImage } from "react-icons/fa6";
import { FaRegTimesCircle } from "react-icons/fa";
import { LuLoader2 } from "react-icons/lu";
import { FaArrowLeft } from "react-icons/fa6";
import { Button } from "../ui/button";
import Typography from "../Typography";
import { imageCompressor, imgToBase64 } from "@/utils/imageCompression";
import { FormType } from "@/app/workspace/create/page";
import { cn } from "@/lib/utils";
import { Workspace } from "@/types/supabase";

const ACCEPTED_IMAGE_TYPES = ["jpeg", "jpg", "png", "webp"];

interface Props {
  setStep: Dispatch<SetStateAction<1|2>>;
}

const Step2 = ({setStep}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();

  const {theme} = useTheme();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isDrag, setIsDrag] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formProps = useFormContext<FormType>();

  // Handler del evento change del input selector de imagen
  const onImageChangeHandler = async (img: File) => {
    setProcessingImage(true);

    const compressedImg = await imageCompressor(img, "file") as File;
    const imgPreview = await imgToBase64(compressedImg);

    setProcessingImage(false);

    setImageFile(img);
    setImagePreview(imgPreview);

    // Actualizar el campo image en el formulario
    formProps.setValue("image", img);

    // Validar manualmente el campo image al seleccionar una imagen
    formProps.trigger("image");
  }

  // Crear el workspace
  const onSubmitHandler = async (values: FormType) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("image", values.image);

      // Crear el workspace
      const {data} = await axios<Workspace>({
        method: "POST",
        url: `/api/workspace/create`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      formProps.reset();
      
      setImageFile(null);
      setImagePreview("");

      toast.success("Workspace created successfully");

      // Redirigir al workspace después de un pequeño delay
      setTimeout(() => {
        router.push(`/workspace/${data.id}`);
      }, 500);

    } catch (error: any) {
      console.log(error);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Typography
        className="mb-2"
        variant="h2"
        text="Add workspace image"
      />

      <Typography
        className="mb-6 text-neutral-300 leading-tight"
        variant="p"
        text="This image can be changed later in the workspace settings."
      />

      <form
        className="flex flex-col gap-3 w-full"
        onSubmit={formProps.handleSubmit(onSubmitHandler)}
      >
        <Controller
          control={formProps.control}
          name="image"
          render={() => {
            return (
              <input
                ref={inputRef}
                hidden
                type="file"
                accept="image/jpg, image/jpeg, image/png, image/webp"
                multiple={false}
                disabled={processingImage || submitting}
                onChange={(e) => {
                  if (e.target.files) {
                    onImageChangeHandler(e.target.files[0]);
                  }
                }}
              />
            )
          }}
        />

        {processingImage &&
          <div className="flex justify-center items-center w-full h-[350px] rounded-md border border-dashed border-neutral-300 bg-neutral-700">
            <LuLoader2 className="text-white animate-spin" size={30} />
          </div>
        }

        {imagePreview && !processingImage &&
          <div className="relative w-full h-[350px] bg-neutral-700 rounded-md overflow-hidden">
            <button
              className="absolute top-2 right-2 block p-1 rounded-full bg-neutral-800/60"
              title="Discard image"
              disabled={submitting}
              onClick={() => {
                setImageFile(null);
                setImagePreview("");
                setIsDrag(false);
                formProps.setValue("image", "");
                formProps.clearErrors("image");
                inputRef.current!.value = "";
              }}
            >
              <FaRegTimesCircle className="text-destructive" size={27} />
            </button>

            <img
              className="w-full h-full object-contain object-center"
              src={imagePreview}
              alt=""
            />
          </div>
        }

        {!imageFile && !processingImage &&
          <div
            className={cn("flex justify-center items-center w-full h-[350px] p-3 border border-dashed rounded-md bg-neutral-700", isDrag ? "border-blue-500 border-2" : "border-neutral-300")}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDrag(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDrag(false);
            }}
            onDrop={(e) => {
              e.preventDefault();

              const droppedFile = Array.from(e.dataTransfer.files);

              if(droppedFile[0]) {
                const extension = droppedFile[0].type.split("/")[1];

                if (!ACCEPTED_IMAGE_TYPES.includes(extension)) {
                  return toast.error("Invalid file type. Select only jpe, jpeg, png or webp files.");
                }

                onImageChangeHandler(droppedFile[0]);
              }
            }}
          >
            <div className="flex flex-col justify-center items-center gap-3">
              <Typography
                className="text-white"
                text="Drop your image or click to select"
                variant="p"
              />

              <FaRegImage className="text-neutral-400/45" size={80} />
            </div>
          </div>
        }

        {formProps.formState.errors.image &&
          <Typography
            className={cn("text-sm text-left font-medium translate-y-[-5px]", theme === "dark" ? "text-red-500" : "text-destructive")}
            text={formProps.formState.errors.image.message as string}
            variant="p"
          />
        }

        <div className="flex justify-end items-center gap-3">          
          <Button
            className="flex justify-start items-center gap-2 text-white border border-neutral-600"
            variant="link"
            type="button"
            disabled={processingImage || submitting}
            onClick={() => setStep(1)}
          >
            <FaArrowLeft />
            <Typography text="Back" variant="p" />
          </Button>

          <Button
            className="flex justify-center items-center gap-1 text-white bg-primary-dark hover:bg-primary-light"
            type="submit"
            disabled={processingImage || submitting}
          >
            {submitting && <LuLoader2 className="animate-spin" size={16} />}
            <Typography text="Create Workspace" variant="p" />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Step2;