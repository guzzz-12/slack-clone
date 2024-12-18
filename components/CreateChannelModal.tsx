"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import Typography from "./Typography";
import Alert from "./Alert";
import FormErrorMessage from "./FormErrorMessage";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";
import { Channel } from "@/types/supabase";

interface Props {
  userId: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setChannels: Dispatch<SetStateAction<Channel[]>>;
}

const ChannelFormSchema = z.object({
  channelName: z
    .string()
    .min(3, {message: "The channel name must be at least 3 characters long"})
    .max(60, {message: "The channel name must be at most 100 characters long"})
    .refine((val) => {
      return val.trim() !== "";
    }, {message: "The channel name cannot be empty"})
});

type ChannelFormType = z.infer<typeof ChannelFormSchema>;

const CreateChannelModal = ({isOpen, setIsOpen, setChannels}: Props) => {
  const router = useRouter();

  const {currentWorkspace} = useWorkspace();
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const {theme} = useTheme();

  const formProps = useForm<ChannelFormType>({
    resolver: zodResolver(ChannelFormSchema),
    defaultValues: {
      channelName: ""
    }
  });


  // Resetear el formulario cuando se cierra el modal
  useEffect(() => {
    return () => {
      if (!isOpen) {
        formProps.reset();
        formProps.clearErrors();
      }
    }
  }, [isOpen, formProps]);

  // Si no hay un workspace actual, no mostrar el modal
  if (!currentWorkspace) return null;

  // Crear el channel
  const onSubmitHandler = async (values: ChannelFormType) => {
    try {
      setSubmitting(true);

      const res = await axios<Channel>({
        method: "POST",
        url: `/api/workspace/${currentWorkspace.workspaceData.id}/channels/create`,
        data: {
          name: values.channelName,
        }
      });

      setChannels((prevChannels) => [...prevChannels, res.data]);

      formProps.reset();

      toast.success("Channel created successfully", {duration: 5000});

      router.refresh();

      setSubmitting(false);
      setIsOpen(false);

    } catch (error: any) {
      let message = error.message;

      if (error instanceof AxiosError && error.response?.status.toString().startsWith("4")) {
        message = error.response.data.message;
        formProps.setError("channelName", {message});
      }

      toast.error(message, {duration: 10000});

      setSubmitting(false);
    }
  }  

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Typography
              className="text-xl font-semibold"
              variant="p"
              text="Create Channel"
            />
          </DialogTitle>

          <DialogDescription>
            Create a new channel in <span className="font-bold">{currentWorkspace.workspaceData.name}</span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <Form {...formProps}>
          <form
            className="flex flex-col gap-3"
            onSubmit={formProps.handleSubmit(onSubmitHandler)}
          >
            <FormField
              name="channelName"
              control={formProps.control}
              render={({field}) => (
                <FormItem>
                  <FormLabel className={cn((theme === "dark" && formProps.formState.errors.channelName) && "text-red-500")}>
                    Channel name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={cn(formProps.formState.errors.channelName ? "border-destructive" : "border")}
                      placeholder="My Channel"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>

                  <FormErrorMessage />
                </FormItem>
              )}
            />

            {error &&
              <Alert
                type="error"
                title="Error creating channel"
                subtitle="Refresh the page and try again after a couple of minutes."
              />
            }

            <div className="flex justify-end">
              <Button
                className="w-max text-white bg-primary-dark hover:bg-primary-light"
                disabled={submitting}
              >
                <Typography text="Create channel" variant="p" />
              </Button>

              <Button
                className="w-max ml-2 text-white bg-transparent hover:bg-neutral-900"
                disabled={submitting}
                onClick={() => setIsOpen(false)}
              >
                <Typography text="Cancel" variant="p" />
              </Button>

            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateChannelModal