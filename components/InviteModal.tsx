"use client"

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import Alert from "./Alert";
import Typography from "./Typography";
import FormErrorMessage from "./FormErrorMessage";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "./ui/form";
import { Label } from "./ui/label";
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
  const invitationLinkInputRef = useRef<HTMLInputElement | null>(null);

  const [invitationLink, setInvitationLink] = useState("");
  const [copied, setCopied] = useState(false);
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

  useEffect(() => {
    // Limpiar el state del input de invitationLink al cerrar el modal
    if(!isOpen && invitationLinkInputRef.current) {
      setInvitationLink("");
      invitationLinkInputRef.current.value = "";
    }
  }, [isOpen]);

  const onSubmitHandler = async (values: FormType) => {
    try {
      setInvitationLink("");
      setSuccess(false);
      setError(false);
      setLoading(true);

      const {data} = await axios<{invitationLink: string}>({
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
      setInvitationLink(data.invitationLink);

    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
        setIsOpen(false);
        return  toast.error(message, {ariaProps: {role: "alert", "aria-live": "assertive"}});
      }

      setError(true);

      toast.error(message, {ariaProps: {role: "alert", "aria-live": "assertive"}});

    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (invitationLink) {
      setCopied(true);

      navigator.clipboard
      .writeText(invitationLink)
      .then(() => {
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      });
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
            Generate an invitation link and share it with your friend to invite them to {workspaceName}.
          </DialogDescription>
        </DialogHeader>

        <Alert
          className="mt-0"
          type="success"
          title="Invitation link generated successfully."
          open={success}
        />

        <Alert
          className="mt-0"
          type="error"
          title="Error sending the invitation."
          subtitle="Refresh the page and try again."
          open={error}
        />

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
                  <FormLabel
                    id="invite-email-label"
                    htmlFor="invite-email"
                    className={cn(theme === "dark" && formProps.formState.errors.email ? "text-red-500" : theme === "light" && formProps.formState.errors.email ? "text-destructive" : "text-white")}
                  >
                    Email
                  </FormLabel>

                  <FormControl>
                    <Input
                      id="invite-email"
                      className={cn(formProps.formState.errors.email ? "border-destructive" : "border")}
                      disabled={loading}
                      aria-labelledby="invite-email-label"
                      aria-describedby="invite-email-description"
                      {...field}
                    />
                  </FormControl>

                  <FormDescription id="invite-email-description">
                    The email of the person you want to invite.
                  </FormDescription>

                  <FormErrorMessage id="invite-email-error-msg" />
                </FormItem>
              )}
            />

            <Button
              className="w-fit ml-auto text-white bg-primary-dark hover:bg-primary-light disabled:pointer-events-none"
              size="sm"
              disabled={loading}
            >
              <Typography
                className="text-sm"
                text="Generate invitation link"
                variant="p"
              />
            </Button>
          </form>
        </Form>

        {invitationLink &&
          <>
            <Separator />

            <div className="flex flex-col items-start w-full">
              <Label
                id="invitation-link-label"
                className="mb-3"
                htmlFor="invitation-link"
              >
                Invitation Link
              </Label>

              <div className="relative flex justify-between items-center w-full mb-1">
                <Input
                  ref={invitationLinkInputRef}
                  id="invitation-link"
                  className="w-full pe-4 text-white"
                  value={invitationLink}
                  disabled
                  aria-labelledby="invitation-link-label"
                  aria-describedby="invitation-link-description"
                />

                {loading && (
                  <Loader2 className="absolute right-2 size-5 text-neutral-400 animate-spin" />
                )}
              </div>

              <span
                id="invitation-link-description"
                className="mb-3 text-sm text-neutral-400"
              >
                Copy this link and share it with your friend to invite them to {workspaceName}. This link will expire in 24 hours, after which you will need to generate a new one.
              </span>
              
              <Button
                className="w-fit ml-auto text-white bg-primary-dark hover:bg-primary-light transition-all"
                size="sm"
                disabled={loading}
                onClick={copyToClipboard}
              >
                <Typography
                  className="text-sm"
                  text={ copied ? "Link copied to clipboard!" : "Copy invitation link"}
                  variant="p"
                />
              </Button>
            </div>
          </>
        }
      </DialogContent>
    </Dialog>
  )
}

export default InviteModal