import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

// Verificar el código de autenticación generado por el magic link.
// Este endpoint es usado para redirigir al clickear el link enviado a la bandeja.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  
  const type = searchParams.get("type") as EmailOtpType | null;

  console.log({token_hash, type});

  if (token_hash && type) {
    const supabase = supabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    if (error) {
      console.log({magic_link_error: error.message});
    }

    if (!error) {
      // redirect user to specified redirect URL or root of app
      return redirect(process.env.NEXT_PUBLIC_PROJECT_URL!);
    }
  }

  // redirect the user to an error page with some instructions
  return redirect("/signin");
}