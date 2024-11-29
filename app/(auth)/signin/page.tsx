"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { BsSlack } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { RxGithubLogo } from "react-icons/rx";
import Typography from "@/components/Typography";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import FormErrorMessage from "@/components/createWorkspace/FormErrorMessage";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabaseBrowserClient } from "@/utils/supabase/supabaseBrowserClient";
import { cn } from "@/lib/utils";

const AuthFormSchema = z.object({
  email: z
    .string()
    .min(1, {message: "The email is required"})
    .email({message: "Invalid email address"})
});

type AuthFormType = z.infer<typeof AuthFormSchema>;

const AuthPage = () => {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const formProps = useForm<AuthFormType>({
    resolver: zodResolver(AuthFormSchema),
    defaultValues: {
      email: ""
    }
  });

  // Verificar si el usuario está autenticado y redirigirlo si lo está
  useEffect(() => {
    const getSession = async () => {
      try {
        const {data, error} = await supabaseBrowserClient.auth.getSession();

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          return router.replace("/");
        }

      } catch (error: any) {
        toast.error(error.message);
        
      } finally {
        setLoadingUser(false);
      }
    }

    getSession();
  }, []);

  // Iniciar sesión o registrarse con google o github
  const onSocialSubmitHandler = async (provider: "google" | "github") => {
    try {
      setLoading(true);

      await supabaseBrowserClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_PROJECT_URL!}/api/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          }
        }
      });

    } catch (error: any) {
      toast.error(error.message, {duration: 10000});
      setLoading(false);
    }
  }

  /** Iniciar sesión o registrarse con magic link */
  const onSubmitHandler = async (values: AuthFormType) => {
    try {
      setLoading(true);
      setSuccess(false);
      setError(false);

      const { error } = await supabaseBrowserClient.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: true,
          // Redirigir a este endpoint para verificar el hash de autenticación del magic link
          emailRedirectTo: process.env.NEXT_PUBLIC_PROJECT_URL!
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      setLoading(false);
      formProps.reset();
      
    } catch (error: any) {
      toast.error(error.message, {duration: 10000});
      setLoading(false);
      setError(true);
    }
  }

  return (
    <main className="relative flex justify-center items-center min-h-screen p-5 text-center">
      {loadingUser &&
        <Spinner />
      }

      {!loadingUser &&
        <section className="w-full max-w-[450px]">
          <div className="flex justify-center items-center gap-3 mb-3">
            <BsSlack size={30} />
            <Typography variant="h2" text="Slack" />
          </div>

          <Typography
            className="mb-1"
            variant="h3"
            text="Sign in to your Slack account"
          />

          <Typography
            variant="p"
            text="We suggest using the email address that you use at work"
          />

          <div className="flex flex-col gap-2 mt-4">
            <Button
              className="relative flex justify-start items-center gap-3 py-6"
              variant="outline"
              disabled={loading}
              onClick={() => onSocialSubmitHandler("google")}
            >
              <FcGoogle
                className="absolute left-4 top-[50%] translate-y-[-50%] z-10"
                size={30}
              />
              <Typography
                className="mx-auto text-lg"
                variant="p"
                text="Sign in with Google"
              />
            </Button>

            <Button
              className="relative flex justify-start items-center gap-3 py-6"
              variant="outline"
              disabled={loading}
            >
              <RxGithubLogo
                className="absolute left-4 top-[50%] translate-y-[-50%] z-10"
                size={30}
              />
              <Typography
                className="mx-auto text-lg"
                variant="p"
                text="Sign in with Github"
              />
            </Button>
          </div>

          <div className="flex justify-between items-center gap-4 my-4">
            <div className="w-full h-[1px] bg-border" />
            <Typography text="OR" variant="p" />
            <div className="w-full h-[1px] bg-border" />
          </div>

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

              {success &&
                <Alert
                  type="success"
                  title="A sign in link has been sent. Check your inbox."
                />
              }

              {error &&
                <Alert
                  type="error"
                  title="Error sending the sign in link."
                  subtitle="Refresh the page and try again after a couple of minutes."
                />
              }

              <Button
                className="text-white bg-primary-dark hover:bg-primary-light"
                disabled={loading}
              >
                <Typography text="Sign in with email" variant="p" />
              </Button>
            </form>
          </Form>
        </section>
      }
    </main>
  )
}

export default AuthPage