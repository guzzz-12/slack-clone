import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { pusher } from "@/utils/pusher";

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

    const {data} = await supabase.auth.getUser();

    if (!data.user) {
      return redirect("/login");
    }

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

    // Verificar si el mensaje fue borrado por el usuario actual
    const filterDeletedMessages = messagesData.map((m) => {
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


// Route handler para crear un mensaje en un channel
export async function POST(req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const channelId = (await params).channelId;

    // Extraer la data del mensaje del body del request
    const {textContent, attachmentUrl} = await req.json() as {
      textContent: string | null;
      attachmentUrl: string | null;
    };

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Validar la ID del channel
    if (!uuidRegex.test(channelId)) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }

    // Validar el textContent y el attachmentUrl
    if (!textContent?.trim() && !attachmentUrl?.trim()) {
      return NextResponse.json({message: "The message cannot be empty"}, {status: 400});
    }

    const supabase = supabaseServerClient();

    const {data: userData} = await supabase.auth.getUser();

    if (!userData.user) {
      return redirect("/login");
    }

    // Crear el mensaje en la base de datos
    const {data: message, error} = await supabase
      .from("messages")
      .insert({
        sender_id: userData.user.id,
        channel_id: channelId,
        text_content: textContent,
        attachment_url: attachmentUrl,
        workspace_id: workspaceId
      })
      .select("*, sender: users(*)")
      .single();
    
    if (error) {
      // Eliminar el attachment si hay error al enviar el mensaje
      if (attachmentUrl) {
        await supabase.storage
        .from("messages-attachments")
        .remove([attachmentUrl.replace("messages-attachments/", "")]);
      }

      throw error;
    }

    // Emitir evento de pusher al channel
    await pusher.trigger(`channel-${channelId}`, "new-message", message);

    return NextResponse.json(message);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL enviando mensaje: ${message}, code: ${code}`);

      // Verificar si el error es not found
      if (code === "PGRST116") {
        return NextResponse.json({message: "Workspace or channel not found"}, {status: 404});
      }

    } else {
      console.log(`Error enviando el mensaje`, error.message);
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}


// Route handler para borrar un mensaje en un channel
export async function DELETE(req: NextRequest, {params}: Context) {
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

    const messageId = new URL(req.url).searchParams.get("messageId");
    const mode = new URL(req.url).searchParams.get("mode");

    // Validar la ID del mensaje
    if (!messageId || !uuidRegex.test(messageId)) {
      return NextResponse.json({message: "Message not found"}, {status: 404});
    }

    // Validar el mode
    if (mode !== "all" && mode !== "me") {
      return NextResponse.json({message: "Invalid deletion mode: must be 'all' or 'me'"}, {status: 400});
    }

    const supabase = supabaseServerClient();
    
    const {data: {user}} = await supabase.auth.getUser();
    
    if (!user) {
      return redirect("/login");
    }

    // Buscar el mensaje en la base de datos
    const {data: message, error} = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .eq("channel_id", channelId)
      .limit(1)
      .single();
    
    // Verificar si hubo error de base de datos al consultar el mensaje
    if (error) {
      throw error;
    }

    // Verificar si el mensaje no existe
    if (!message) {
      return NextResponse.json({message: "Message not found"}, {status: 404});
    }

    // Eliminar el mensaje para todos
    if (mode === "all" && message.sender_id === user.id) {
      const {data: updatedMessage, error: updateMessageError} = await supabase
        .from("messages")
        .update({
          text_content: "<p class= 'deleted-message'>Message deleted</p>",
          attachment_url: null,
          deleted_for_all: true,
          deleted_for_ids: []
        })
        .eq("id", messageId)
        .eq("channel_id", channelId)
        .select("*, sender:users(*)")
        .single();

      if (updateMessageError) {
        throw updateMessageError;
      }

      // Eliminar el attachment del storage si existe
      if (message.attachment_url) {
        const {error: deleteAttachmentError} = await supabase.storage
        .from("messages-attachments")
        .remove([message.attachment_url.replace("messages-attachments/", "")]);

        if (deleteAttachmentError) {
          throw deleteAttachmentError;
        }
      }

      // Emitir evento de mensaje eliminado a todos los miembros del channel
      await pusher.trigger(
        `channel-${channelId}`, 
        "message-deleted", 
        updatedMessage
      );

      return NextResponse.json("success");
    }

    // Eliminar el mensaje para el usuario actual
    if (mode === "me") {
      const deletedFor = message.deleted_for_ids || [];

      const {data: updatedMessage, error: updateMessageError} = await supabase
        .from("messages")
        .update({
          deleted_for_ids: [...deletedFor, user.id]
        })
        .eq("id", messageId)
        .eq("channel_id", channelId)
        .select("*, sender:users(*)")
        .single();

      if (updateMessageError) {
        throw updateMessageError;
      }

      updatedMessage.text_content = "<p class= 'deleted-message'>Message deleted</p>";
      updatedMessage.attachment_url = null;

      return NextResponse.json(updatedMessage);
    }

    return NextResponse.json(message);

  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL eliminando el mensaje: ${message}, code: ${code}`);

      // Verificar si el error es de mensaje no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Message not found"}, {status: 404});
      }
    } else {
      console.log(`Error eliminando el mensaje`, error.message);
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}