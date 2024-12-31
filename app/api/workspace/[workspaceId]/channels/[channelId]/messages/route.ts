import { NextResponse } from "next/server";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

interface Context {
  params: Promise<{workspaceId: string, channelId: string}>
}

// Route handler para consultar los mensajes de un channel
export async function GET(req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const channelId = (await params).channelId;
    const perPage = 10;
    let hasMore = true;

    // Extraer el page del query string
    let page = new URL(req.url).searchParams.get("page");

    // Verificar que el page exista y sea número o string numérico
    if (!page || Number(page) === 0 || isNaN(Number(page))) {
      page = "1";
    }

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Validar la ID del channel
    if (!uuidRegex.test(channelId)) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }

    const supabase = supabaseServerClient();

    // Calcular la paginación de los mensajes
    const from = +perPage * (+page - 1);
    const to = from + (perPage - 1);

    // Consultar los mensajes del channel en la base de datos
    // incluyendo el sender y paginados de a 10 por página
    const {data: messagesData, error: messagesError} = await supabase
      .from("messages")
      .select("*, sender:users(id, name, avatar_url)")
      .eq("workspace_id", workspaceId)
      .eq("channel_id", channelId)
      .order("created_at", {ascending: false})
      .range(from, to);

    if (messagesError) {
      throw messagesError;
    }

    // Verificar si hay mensajes para mostrar
    if (messagesData.length < perPage) {
      hasMore = false;
    }

    return NextResponse.json({messages: messagesData.reverse(), hasMore});
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando mensajes del channel: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Channel not found"}, {status: 404});
      }
    }

    console.log(`Error consultando mensajes del channel`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}