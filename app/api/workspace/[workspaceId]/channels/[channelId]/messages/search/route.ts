import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

interface Context {
  params: Promise<{workspaceId: string, channelId: string}>
}

// Route handler para buscar mensajes en un channel
export async function GET(req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const channelId = (await params).channelId;
    const perPage = 10;
    let hasMore = true;

    const searchParams = new URL(req.url).searchParams;

    // Extraer el searchTerm del query string
    const searchTerm = searchParams.get("searchTerm");

    // Extraer el page del query string
    let page = searchParams.get("page");

    // Verificar que el searchTerm exista
    if (!searchTerm || searchTerm.trim().length === 0) {
      return NextResponse.json({message: "Search term is required"}, {status: 400});
    }

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
    
    const {data} = await supabase.auth.getUser();

    if (!data.user) {
      return redirect("/signin");
    }

    // Calcular el limit y el offset del query para paginar los mensajes
    const limit = perPage;
    const offset = (Number(page) - 1) * perPage;

    const {data: messages, error: messagesError} = await supabase.rpc("search_messages_fts", {
      term: searchTerm,
      amount: limit,
      skip: offset
    });

    if (messagesError) {
      throw messagesError;
    }

    // Verificar si hay mensajes para mostrar
    if (messages.length < perPage) {
      hasMore = false;
    }

    // Verificar si el mensaje fue borrado por el usuario actual
    const filterDeletedMessages = messages.map((m) => {
      if (m.deleted_for_ids?.includes(data.user.id)) {
        return {
          ...m,
          text_content: "<p class= 'deleted-message'>Message deleted</p>",
          attachment_url: null
        }
      }

      return m
    });

    return NextResponse.json({messages: filterDeletedMessages.reverse(), hasMore});
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL buscando mensajes del channel: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Channel not found"}, {status: 404});
      }
    }

    console.log(`Error consultando mensajes del channel`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}