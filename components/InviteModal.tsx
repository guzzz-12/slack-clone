"use client"

import { Dispatch, SetStateAction, useState } from "react";
import { set, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import Typography from "./Typography";
import FormErrorMessage from "./FormErrorMessage";
import Alert from "./Alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  workspaceId: string | undefined;
  workspaceName: string | undefined;
  inviteCode: string | undefined;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const FormSchema = z.object({
  email: z
    .string()
    .min(1, {message: "The email is required"})
    .email({message: "Invalid email address"})
});

type FormType = z.infer<typeof FormSchema>;

const InviteModal = ({workspaceId, workspaceName, inviteCode, isOpen, setIsOpen}: Props) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const {theme} = useTheme();

  const formProps = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmitHandler = async (values: FormType) => {
    try {
      setSuccess(false);
      setError(false);
      setLoading(true);

      await axios({
        method: "POST",
        url: `/api/invite`,
        data: {
          workspaceName,
          workspaceId,
          inviteCode,
          email: values.email
        }
      });

      setSuccess(true);

    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
        setIsOpen(false);
        return  toast.error(message);
      }

      setError(true);

      toast.error(message);

    } finally {
      setLoading(false);
    }
  }

  if (!workspaceId || !workspaceName || !inviteCode) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (loading) return;
        setSuccess(false);
        setError(false);
        formProps.reset();
        setIsOpen(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Invite a friend to join {workspaceName}
          </DialogTitle>

          <DialogDescription>
            Type the email of the person you want to invite
          </DialogDescription>
        </DialogHeader>

        {success &&
          <Alert
            className="mt-0"
            type="success"
            title="Invitation sent successfully."
          />
        }

        {error &&
          <Alert
            className="mt-0"
            type="error"
            title="Error sending the invitation."
            subtitle="Refresh the page and try again."
          />
        }

        <Separator />

        <Form {...formProps}>
          <form
            className="flex flex-col gap-3"
            onSubmit={formProps.handleSubmit(onSubmitHandler)}
          >
            <FormField
              name="email"
              control={formProps.control}
              render={({field}) => (
                <FormItem>
                  <FormLabel className={cn(theme === "dark" && formProps.formState.errors.email ? "text-red-500" : theme === "light" && formProps.formState.errors.email ? "text-destructive" : "text-white")}>
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={cn(formProps.formState.errors.email ? "border-destructive" : "border")}
                      placeholder="john.doe@mail.com"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>

                  <FormErrorMessage />
                </FormItem>
              )}
            />

            <Button
              className="text-white bg-primary-dark hover:bg-primary-light"
              disabled={loading}
            >
              <Typography text="Send invitation" variant="p" />
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default InviteModal