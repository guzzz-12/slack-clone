import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { v4 } from "uuid";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { MessageAttachmentSchema } from "@/utils/formSchemas";
import { b2Client } from "@/utils/backblaze";
import { pusher } from "@/utils/pusher";
import { UploadResponseData, UploadUrlData } from "@/types/backblaze";

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
      return redirect("/signin");
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
  // ID de la imagen en el bucket para eliminarla en caso de que haya error creando el workspace
  let fileId = "";
  let fileName = "";

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

    // Extraer la data del body del request
    const formData = await req.formData();
    const textContent = formData.get("textContent") as string;
    const file = formData.get("file") as File;

    let attachmentUrl: string | null = null;
    const msgId = v4();

    // Verificar que el mensaje no este vacio
    if (!file && (!textContent || textContent.trim() === "")) {
      return NextResponse.json({message: "The message cannot be empty"}, {status: 400});
    }

    // Validar el archivo si lo hay
    // Y subirlo al bucket
    if (file) {
      const {error: fileValidationError} = MessageAttachmentSchema.safeParse({file});

      // Verificar si hay errores de validación
      if (fileValidationError) {
        const errors = fileValidationError.errors.map(err => err.message).join(". ");
        return NextResponse.json({message: errors}, {status: 400});
      }

      // Convertir la imagen en buffer para que sea compatible con backblaze
      const buffer = Buffer.from(await file.arrayBuffer());
  
      // Autorizar backblaze
      await b2Client.authorize();
  
      // Generar la url de subida del archivo en backblaze
      const uploadUrl = await b2Client.getUploadUrl({
        bucketId: process.env.BACKBLAZE_BUCKET_ID as string,
      });
  
      // Data de la url de subida del archivo al bucket
      const urlData = uploadUrl.data as UploadUrlData;

      // Generar nombre del archivo
      const attachmentName = `msg_id_${msgId}.webp`;
  
      // Subir el archivo al bucket
      const uploadRes = await b2Client.uploadFile({
        uploadAuthToken: urlData.authorizationToken,
        uploadUrl: urlData.uploadUrl,
        data: buffer,
        fileName: `messages/${msgId}/${attachmentName}`,
      });
      
      // Data de la imagen subida al bucket
      const uploadData = uploadRes.data as UploadResponseData;
      fileId = uploadData.fileId;
      fileName = uploadData.fileName;
      attachmentUrl = `${process.env.BACKBLAZE_BUCKET_URL}/${fileName}`;
    }

    const supabase = supabaseServerClient();

    const {data: userData} = await supabase.auth.getUser();

    if (!userData.user) {
      return redirect("/signin");
    }

    // Crear el mensaje en la base de datos
    const {data: message, error} = await supabase
      .from("messages")
      .insert({
        id: msgId,
        sender_id: userData.user.id,
        channel_id: channelId,
        text_content: textContent,
        attachment_url: attachmentUrl,
        attachment_key: fileId,
        attachment_name: fileName,
        workspace_id: workspaceId
      })
      .select("*, sender: users(*)")
      .single();
    
    if (error) {
      // Eliminar el attachment si hay error al enviar el mensaje
      if (attachmentUrl) {
        await b2Client.deleteFileVersion({
          fileId,
          fileName
        });
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
      return redirect("/signin");
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
          attachment_key: null,
          attachment_name: null,
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
        await b2Client.deleteFileVersion({
          fileId: message.attachment_key as string,
          fileName: message.attachment_name as string
        })
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