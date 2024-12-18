import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { isPostgresError } from "@/utils/constants";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Crear un chanel asociado a un workspace mediante su ID
export async function POST(req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    // Extraer la data del formulario
    let {name, chanelType} = await req.json() as {
      name: string,
      chanelType: "public" | "private"
    };

    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();
    
    if (!user) {
      return redirect("/login");
    }
    
    // Crear el channel en la base de datos
    const {data, error} = await supabase
    .from("channels")
    .insert({
      // Capitalizar el name
      name: name.charAt(0).toUpperCase() + name.toLowerCase().slice(1),
      // Convertir a boolean los strings "public" y "private"
      is_public: chanelType === "public" ? true : false,
      workspace_id: workspaceId,
      ws_admin_id: user.id
    })
    .select()
    .single();
    
    if (error) {
      throw error;
    }

    return NextResponse.json(data);
    
  } catch (error) {
    if (isPostgresError(error)) {
      const {message, code} = error;
  
      console.log(`Error PostgreSQL creando channel: ${message}, code: ${code}`);
  
      if (code === "23505") {
        return NextResponse.json({message: "There's already a channel with that name"}, {status: 409});
      }
    }

    console.log(`Error creando channel`, error);

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}