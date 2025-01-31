import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import FormErrorMessage from "./FormErrorMessage";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { User } from "@/types/supabase";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileModal: FC<Props> = ({ open, setOpen }) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  
  const [loading, setLoading] = useState(false);

  const {user, setUser} = useUser();

  const formSchema = z.object({
    name: z.string().min(1, {message: "The name is required"}),
  });

  type FormType = z.infer<typeof formSchema>;

  const formProps = useForm<FormType>({
    resolver: zodResolver(formSchema),
    shouldFocusError: true,
    defaultValues: {
      name: user?.name || "",
    },
  });


  // Focus trap y cerrar modal al pulsar escape
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) return;

    if (event.key === "Escape") {
      setOpen(false);
    }
    
    const refs = [inputRef.current!, confirmBtnRef.current!, cancelBtnRef.current!];

    if (event.key === "Tab") {
      if (event.shiftKey) {
        if (document.activeElement === refs[0]) {
          event.preventDefault();
          refs[refs.length - 1].focus();

        } else if (document.activeElement === refs[refs.length - 1]) {
          event.preventDefault();
          refs[(refs.length - 1) - 1].focus();

        } else {
          event.preventDefault();
          const index = refs.findIndex(ref => ref === document.activeElement);
          refs[index - 1].focus();
        }
      } else {
        if (document.activeElement === refs[0]) {
          event.preventDefault();
          refs[1].focus();

        } else if (document.activeElement === refs[refs.length - 1]) {
          event.preventDefault();
          refs[0].focus();

        } else {
          event.preventDefault();
          const index = refs.findIndex(ref => ref === document.activeElement);
          refs[index + 1].focus();
        }
      }
    }
  };


  const submitHandler = async (values: FormType) => {
    try {
      setLoading(true);

      const res = await axios<User>({
        url: `/api/user`,
        method: "PATCH",
        data: {
          name: values.name
        }
      });

      setUser(res.data);

      toast.success("Profile updated successfully");

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
                      {...formProps.register("name")}
                      {...field}
                      ref={inputRef}
                    />
                  </FormControl>

                  <FormErrorMessage />
                </FormItem>
              )}
            />

            <footer className="flex justify-end items-center gap-2 w-full">
              <Button
                ref={confirmBtnRef}
                disabled={loading}
              >
                Update Profile
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