"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import Spinner from "@/components/Spinner";
import { supabaseBrowserClient } from "@/utils/supabase/supabaseBrowserClient";
import { Workspace } from "@/types/supabase";

interface Props {
  searchParams: {
    token: string;
  }
}

const InvitePage = ({searchParams: {token}}: Props) => {
  const router = useRouter();

  const supabase = supabaseBrowserClient;

  // Confirmar invitación
  const confirmInvitation = async () => {
    try {
      const {data: {user}} = await supabase.auth.getUser();

      if (!user) {
        toast.error("You need to be signed in with your email address to confirm the invitation to the workspace.", {duration: 20000});

        router.replace("/signin");

        return null;
      }

      if (!token) {
        toast.error("Invalid invitation link.", {duration: 20000});
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
      
      router.replace(`/workspace/${data.id}`);

    } catch (error: any) {
      let message = error.message;
  
      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }
  
      toast.dismiss();
      toast.error(message, {duration: 10000});

      router.replace("/");
    }
  }

  
  useEffect(() => {
    confirmInvitation();
  }, [token]);

  return <Spinner />
}

export default InvitePage