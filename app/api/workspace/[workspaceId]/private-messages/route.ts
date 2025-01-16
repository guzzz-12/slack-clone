import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { PrivateMessageWithSender } from "@/types/supabase";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Route handler para consultar los mensajes privados entre dos usuarios en un workspace
export async function GET(req: NextRequest, {params}: Context) {
  try {    
    const workspaceId = (await params).workspaceId;
    
    const searchParams = new URL(req.url).searchParams;
    const otherUserId = searchParams.get("otherUserId");
    const searchTerm = searchParams.get("searchTerm");
    const page = searchParams.get("page") || "1";

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Validar la ID del otro usuario
    if (!otherUserId || !uuidRegex.test(otherUserId)) {
      return NextResponse.json({message: "User not found"}, {status: 404});
    }

    // Validar que el page sea un número o string numérico
    if (Number(page) === 0 || isNaN(Number(page))) {
      return NextResponse.json({message: "Invalid page"}, {status: 400});
    }
    
    const supabase = supabaseServerClient();

    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return redirect("/signin");
    }

    const limit = 10;
    const offset = (Number(page) - 1) * limit;
    let hasMore = true;

    // Consultar los mensajes entre ambos usuarios en el workspace
    const {data: messagesData, error: messagesError} = await supabase.rpc("get_private_messages", {
      workspace: workspaceId,
      sender: user.id,
      recipient: otherUserId,
      amount: limit,
      skip: offset,
      search_term: searchTerm || undefined
    });

    if (messagesError) {
      throw messagesError;
    }

    // Verificar si hay mensajes para mostrar
    if (messagesData.length < limit) {
      hasMore = false;
    }

    /** Eliminar el contenido de los mensajes eliminados sólo para el usuario actual */
    const filteredDeletedMessages = (messages: PrivateMessageWithSender[]) => {
      return messages.map((m) => {
        if (m.deleted_for_ids?.includes(user.id)) {
          return {
            ...m,
            text_content: "<p class= 'deleted-message'>Message deleted</p>",
            attachment_url: null
          }
        }
  
        return m
      });
    }

    const filteredDeleted = filteredDeletedMessages(messagesData);

    return NextResponse.json({
      messages: filteredDeleted.reverse(),
      hasMore
    });
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando mensajes privados: ${message}, code: ${code}`);

      // Verificar si el error es de workspace no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Workspace not found"}, {status: 404});
      }

    } else {
      console.log(error);
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}