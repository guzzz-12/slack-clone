import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Crear un chanel asociado a un workspace mediante su ID
export async function POST(req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    // Extraer el name del workspace de la data del formulario
    const {name} = await req.json() as {name: string};

    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();
    
    if (!user) {
      return redirect("/login");
    }
    
    // Crear el channel en la base de datos
    const {error} = await supabase
    .from("channels")
    .insert({
      name,
      workspace_id: workspaceId,
      ws_admin_id: user.id
    });
    
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json("Success");
    
  } catch (error) {
    console.log(`Error creando channel`, error);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}