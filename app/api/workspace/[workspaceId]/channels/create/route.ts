import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { isPostgresError } from "@/utils/constants";
import { pusher } from "@/utils/pusher";

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
      return redirect("/signin");
    }

    // Verificar si el usuario es admin del workspace
    const {data: workspaceAdminData, error: workspaceAdminError} = await supabase
    .from("workspaces")
    .select("id, admin_id")
    .eq("id", workspaceId)
    .limit(1)
    .single();

    if (workspaceAdminError) {
      throw workspaceAdminError;
    }

    if (workspaceAdminData.admin_id !== user.id) {
      return NextResponse.json({message: "You are not an admin of this workspace"}, {status: 403});
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
      ws_admin_id: user.id,
      meeting_members: []
    })
    .select()
    .single();
    
    if (error) {
      throw error;
    }

    // Enviar el evento de nuevo channel a los miembros del workspace
    await pusher.trigger(`workspace-${workspaceId}`, "new-channel", data);

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