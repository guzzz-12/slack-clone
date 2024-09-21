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

  console.log({MAGIC_LINK_LOGIN_PARAMS: {token_hash, type}});

  if (token_hash && type) {
    const supabase = supabaseServerClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    if (error) {
      console.log({magic_link_error: error.message});
      return redirect("/login");
    }

    console.log("MAGIC_LINK_LOGIN_SUCCESS", data.user);
  }

  return redirect(process.env.NEXT_PUBLIC_PROJECT_URL!);
}