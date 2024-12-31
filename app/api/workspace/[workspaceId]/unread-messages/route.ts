import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Route handler para consultar los mensajes sin leer de los channels de un workspace
export async function GET(req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    const supabase = supabaseServerClient();

    // Consultar los mensajes sin leer de todos los channels del workspace
    const {data: messages, error} = await supabase.from("messages")
      .select("id, channel_id, workspace_id")
      .eq("workspace_id", workspaceId)
      .is("seen_at", null)

    // Verificar si hubo error de base de datos al consultar los mensajes sin leer
    if (error) {
      throw error;
    }

    return NextResponse.json(messages, {status: 200});
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando mensajes sin leer: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Workspace not found"}, {status: 404});
      }
    }

    console.log(`Error consultando mensajes sin leer`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}