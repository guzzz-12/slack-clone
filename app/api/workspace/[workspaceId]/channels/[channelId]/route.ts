import { NextResponse } from "next/server";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

interface Context {
  params: Promise<{workspaceId: string, channelId: string}>
}

// Route handler para consultar un channel asociado a un workspace
export async function GET(_req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const channelId = (await params).channelId;

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }
    
    // Validar la ID del channel
    if (!uuidRegex.test(channelId)) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }
    
    const supabase = supabaseServerClient();

    // Consultar el channel en la base de datos
    const {data: channel, error} = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .eq("workspace_id", workspaceId)
      .limit(1)
      .single();

    // Verificar si hubo error de base de datos al consultar el channel
    if (error) {
      throw error;
    }

    if (!channel) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }

    return NextResponse.json(channel);

  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando channel: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Channel not found"}, {status: 404});
      }
    }

    console.log(`Error consultando channel`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}