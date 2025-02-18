"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { LuLoader2 } from "react-icons/lu";
import { supabaseBrowserClient } from "@/utils/supabase/supabaseBrowserClient";
import { Workspace } from "@/types/supabase";

interface Props {
  searchParams: {
    token: string;
  }
}

const InvitePage = ({searchParams: {token}}: Props) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = supabaseBrowserClient;

  // Confirmar invitación
  const confirmInvitation = async () => {
    try {
      const {data: {user}} = await supabase.auth.getUser();

      if (!user) {
        toast.error("You need to be signed in with your email address to confirm the invitation to the workspace.", {duration: 20000, ariaProps: {role: "alert", "aria-live": "assertive"}});

        router.replace("/signin");

        return null;
      }

      if (!token) {
        toast.error("Invalid invitation link.", {duration: 20000, ariaProps: {role: "alert", "aria-live": "assertive"}});
        return router.replace("/");
      }

      const {data} = await axios<Workspace>({
        method: "GET",
        url: "/api/invite",
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          token
        }
      });
      
      toast.success(`You have successfully joined ${data.name}.`, {duration: 5000});

      setSuccess(true);
      
      setTimeout(() => {
        router.replace(`/workspace/${data.id}`);        
      }, 2000);

    } catch (error: any) {
      let message = error.message;
  
      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }
  
      toast.dismiss();
      toast.error(message, {duration: 10000, ariaProps: {role: "alert", "aria-live": "assertive"}});

      setError(message);

      setTimeout(() => {
        router.replace("/");
      }, 2000);

    } finally {
      setLoading(false);
    }
  }

  
  useEffect(() => {
    confirmInvitation();
  }, [token]);

  return (
    <main className="flex justify-center items-center w-full max-w-[450px] h-screen mx-auto">
      {loading && (
        <section className="flex flex-col justify-center items-center gap-3 w-full h-full text-center">
          <LuLoader2 className="animate-spin" size={40} />

          <h1 className="text-xl">
            Processing invitation...
          </h1>
        </section>
      )}

      {success && (
        <section className="flex flex-col justify-center items-center gap-2 w-full h-full text-center">
          <LuLoader2 className="animate-spin" size={40} />

          <h1 className="text-xl">
            Invitation confirmed <br />
            Redirecting...
          </h1>
        </section>)
      }

      {error && (
        <section className="flex flex-col justify-center items-center gap-2 w-full h-full text-center">
          <LuLoader2 className="animate-spin" size={40} />

          <h1 className="text-xl">
            There was an error confirming the invitation.
          </h1>

          <p className="font-semibold">
            {error}
          </p>
        </section>
      )}
    </main>
  )
}

export default InvitePage