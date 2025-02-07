"use client"

import { useRouter } from "next/navigation";
import { MdLogout } from "react-icons/md";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { supabaseBrowserClient } from "@/utils/supabase/supabaseBrowserClient";


const SignoutBtn = () => {
  const router = useRouter();

  const supabase = supabaseBrowserClient;

  const signoutHandler = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="p-2"
            aria-labelledby="signout-tooltip-trigger-label"
            onClick={signoutHandler}
          >
            <MdLogout size={30} aria-hidden />
            <span id="signout-tooltip-trigger-label" hidden>
              Sign out
            </span>
          </button>
        </TooltipTrigger>

        <TooltipContent>
          <p>Sign out</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default SignoutBtn