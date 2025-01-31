import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isPostgresError } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

export async function PATCH(req: NextRequest) {
  try {
    const {name} = await req.json() as {name: string};

    if (!name || name.trim() === "" || name.length < 3) {
      return NextResponse.json({message: "Your name is required"}, {status: 400});
    }

    const supabase = supabaseServerClient();

    const {data: currentUser} = await supabase.auth.getUser();

    if (!currentUser.user) {
      return redirect("/signin");
    }

    const {data: updatedUserData, error} = await supabase
    .from("users")
    .update({name})
    .eq("id", currentUser.user.id)
    .select("*")
    .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedUserData);
    
  } catch (error: any) {
    let message = error.message;

    if (isPostgresError(error)) {
      const {message, code} = error;
      console.log(`Error PostgreSQL actualizando perfil del usuario: ${message}, code: ${code}`);

    } else {
      console.log(`Error actualizando perfil del usuario: ${message}`);      
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}