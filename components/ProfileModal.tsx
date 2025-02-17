import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { LuLoader2 } from "react-icons/lu";
import { FaRegEdit, FaRegTimesCircle } from "react-icons/fa";
import Typography from "./Typography";
import FormErrorMessage from "./FormErrorMessage";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useUser } from "@/hooks/useUser";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/utils/formSchemas";
import { imageCompressor, imgToBase64 } from "@/utils/imageCompression";
import { User } from "@/types/supabase";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ImageSchema = z.object({
  avatar: z
    .any()
    .refine((file: File) => !!file, "The avatar is required")
    .refine((file) => file.size <= MAX_FILE_SIZE, "The avatar must be maximum 5MB")
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    )
});

const ProfileModal: FC<Props> = ({ open, setOpen }) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const changeAvatarBtnRef = useRef<HTMLButtonElement | null>(null);
  const discardAvatarBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  
  const [processingImage, setProcessingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);

  const {user, setUser} = useUser();

  const formSchema = z.object({
    name: z
      .string()
      .min(1, {message: "The name is required"})
      .min(3, {message: "The name must contain at least 3 characters"})
  });

  type FormType = z.infer<typeof formSchema>;

  const formProps = useForm<FormType>({
    resolver: zodResolver(formSchema),
    shouldFocusError: true,
    defaultValues: {
      name: user?.name || ""
    },
  });


  // Focus trap y cerrar modal al pulsar escape
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) return;

    if (event.key === "Escape") {
      setOpen(false);
    }
    
    const refs = [inputRef.current, confirmBtnRef.current, cancelBtnRef.current];

    if (event.key === "Tab") {
      if (event.shiftKey) {
        if (document.activeElement === refs[0]) {
          event.preventDefault();
          refs[refs.length - 1]?.focus();

        } else if (document.activeElement === refs[refs.length - 1]) {
          event.preventDefault();
          refs[(refs.length - 1) - 1]?.focus();

        } else {
          event.preventDefault();
          const index = refs.findIndex(ref => ref === document.activeElement);
          refs[index - 1]?.focus();
        }
      } else {
        if (document.activeElement === refs[0]) {
          event.preventDefault();
          refs[1]?.focus();

        } else if (document.activeElement === refs[refs.length - 1]) {
          event.preventDefault();
          refs[0]?.focus();

        } else {
          event.preventDefault();
          const index = refs.findIndex(ref => ref === document.activeElement);
          refs[index + 1]?.focus();
        }
      }
    }
  };


  const onImageChangeHandler = async (img: File) => {
    setProcessingImage(true);

    const compressedImg = await imageCompressor(img, "file") as File;
    const imgPreview = await imgToBase64(compressedImg);

    setProcessingImage(false);

    setImageFile(compressedImg);
    setImagePreview(imgPreview);
  }


  const submitHandler = async (values: FormType) => {
    const formData = new FormData();

    if (imageFile) {
      const imageValidationError = ImageSchema.safeParse({avatar: imageFile}).error;

      if (imageValidationError) {
        const errors = imageValidationError.errors.map(err => err.message).join(". ");
        setImageError(errors);
        return;
      }
      
      formData.append("avatar", imageFile);
    }

    formData.append("name", values.name);

    try {
      setLoading(true);

      const res = await axios<User>({
        url: `/api/user`,
        method: "PATCH",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setUser(res.data);

      formProps.reset();

      toast.success("Profile updated successfully");

      setImageFile(null);
      setImagePreview("");
      setImageError("");
      setOpen(false);

    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }

      toast.error(message);
      
    } finally {
      setLoading(false);
    }
  }


  // Setear el valor del form con el nombre del user si lo tiene
  useEffect(() => {
    if (user && user.name) {
      formProps.setValue("name", user.name);
    }
  }, [user]);


  // Deshabilitar el scroll del body al abrir el modal
  // y habilitarlo de nuevo al cerrarlo
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = "unset";
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);


  if (!open || !user) return null;


  const Dialog = (
    <dialog
      ref={modalRef}
      className="fixed top-0 left-0 flex justify-center items-center w-full h-screen bg-black/80 z-[1000]"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <section
        className="flex flex-col justify-center items-center gap-4 p-4 bg-neutral-800 rounded-md"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex flex-col justify-center items-center">
          <h2
            id="modal-title"
            className="text-lg font-semibold"
          >
            Your Profile
          </h2>

          <p
            id="modal-description"
            className="text-sm opacity-90"
          >
            Update your personal information
          </p>
        </header>

        <div className="w-full h-[1px] bg-neutral-600" />

        <Form {...formProps}>
          <form
            className="flex flex-col gap-4 w-full min-w-[360px]"
            onSubmit={formProps.handleSubmit(submitHandler)}
          >
            <input
              ref={imageInputRef}
              hidden
              type="file"
              accept="image/jpg, image/jpeg, image/png, image/webp"
              multiple={false}
              disabled={processingImage || loading}
              onChange={(e) => {
                if (e.target.files) {
                  onImageChangeHandler(e.target.files[0]);
                }
              }}
            />

            {!processingImage &&
              <div className="flex flex-col gap-2">
                <TooltipProvider>
                  <div className="relative w-full h-[180px] aspect-square bg-neutral-700 rounded-md overflow-hidden">
                    {imagePreview && imageFile &&
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            ref={discardAvatarBtnRef}
                            className="absolute top-2 right-2 block w-[35px] h-[35px] p-1 rounded-full bg-neutral-800/60"
                            type="button"
                            aria-labelledby="discard-avatar"
                            disabled={loading || processingImage}
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                              imageInputRef.current!.value = "";
                            }}
                          >
                            <FaRegTimesCircle className="w-full h-full text-red-500" aria-hidden />
                          </button>
                        </TooltipTrigger>

                        <TooltipContent>
                          <span id="discard-avatar" className="text-sm">
                            Discard changes
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    }

                    {!imagePreview && !imageFile &&
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            ref={changeAvatarBtnRef}
                            className="absolute top-2 right-2 flex justify-center items-center w-[35px] h-[35px] p-2 rounded-full bg-neutral-800/60"
                            type="button"
                            aria-labelledby="change-avatar"
                            disabled={loading || processingImage}
                            onClick={() => {
                              imageInputRef.current!.click();
                            }}
                            {...(imageError && {
                              "aria-describedby": "image-validation-error-message"
                            })}
                          >
                            <FaRegEdit className="w-full h-full text-neutral-200" aria-hidden />
                          </button>
                        </TooltipTrigger>

                        <TooltipContent>
                          <span id="change-avatar" className="text-sm">
                            Change Avatar
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    }
        
                    <img
                      className="w-full h-full object-contain object-center"
                      src={imagePreview || user.avatar_url!}
                      alt={imagePreview ? "Selected avatar preview" : "Your current avatar"}
                    />
                  </div>
                </TooltipProvider>
                
                {imageError &&
                  <Typography
                    id="image-validation-error-message"
                    className={cn("text-sm text-left font-medium translate-y-[-5px] text-red-500")}
                    text={imageError}
                    variant="p"
                  />
                }
              </div>
            }

            {processingImage &&
              <div className="flex justify-center items-center w-full h-[180px] rounded-md border border-dashed border-neutral-300 bg-neutral-700">
                <LuLoader2 className="text-white animate-spin" size={30} />
              </div>
            }

            <FormField
              name="name"
              control={formProps.control}
              render={({field}) => (
                <FormItem>
                  <FormLabel className={cn(formProps.formState.errors.name ? "text-red-500" : "text-white")}>
                    Your Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={cn(formProps.formState.errors.name ? "border-destructive" : "border-neutral-600")}
                      disabled={loading}
                      {...(formProps.formState.errors.name && {"aria-describedby": "name-error-msg"})}
                      {...formProps.register("name")}
                      {...field}
                      ref={inputRef}
                    />
                  </FormControl>

                  <FormErrorMessage id="name-error-msg" />
                </FormItem>
              )}
            />

            <footer className="flex justify-end items-center gap-2 w-full">
              <Button
                ref={confirmBtnRef}
                disabled={loading}
              >
                Save Changes
              </Button>

              <Button
                ref={cancelBtnRef}
                className="border-neutral-600"
                variant="outline"
                type="button"
                disabled={loading}
                onClick={() => {
                  if (loading) return;
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
            </footer>
          </form>
        </Form>
      </section>
    </dialog>
  );

  return createPortal(Dialog, document.body);
}

export default ProfileModal