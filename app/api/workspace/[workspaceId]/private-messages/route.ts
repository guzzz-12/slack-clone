import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { v4 } from "uuid";
import { combineUuid, isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { PrivateMessageWithSender } from "@/types/supabase";
import { MessageAttachmentSchema } from "@/utils/formSchemas";
import { b2Client } from "@/utils/backblaze";
import { pusher } from "@/utils/pusher";
import { UploadResponseData, UploadUrlData } from "@/types/backblaze";

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
      sender_user_id: user.id,
      recipient_user_id: otherUserId,
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

// Route handler para enviar un mensaje privado
export async function POST(req: NextRequest, {params}: Context) {
  // ID del attachment en el bucket para eliminarlo
  // en caso de que haya error enviando el mensaje
  let fileId = "";
  let fileName = "";

  try {
    const searchParams = new URL(req.url).searchParams;

    const workspaceId = (await params).workspaceId;
    const otherUserId = searchParams.get("otherUserId");

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Validar la ID del otro usuario
    if (!otherUserId || !uuidRegex.test(otherUserId)) {
      return NextResponse.json({message: "User not found"}, {status: 404});
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

      const extension = file.type.startsWith("image") ? "webp" : "pdf";

      // Generar nombre del archivo
      const attachmentName = `msg_id_${msgId}.${extension}`;
  
      // Subir el archivo al bucket
      const uploadRes = await b2Client.uploadFile({
        uploadAuthToken: urlData.authorizationToken,
        uploadUrl: urlData.uploadUrl,
        data: buffer,
        fileName: `private-messages/${msgId}/${attachmentName}`,
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

    const {data: messageData, error: messageError} = await supabase
    .from("private_messages")
    .insert({
      id: msgId,
      sender_id: userData.user.id,
      recipient_id: otherUserId,
      text_content: textContent,
      attachment_url: attachmentUrl,
      attachment_key: fileId,
      attachment_name: fileName,
      workspace_id: workspaceId,
      message_type: file ? (file.type.startsWith("image") ? "image" : "pdf") : "text"
    })
    .select("*, recipient:users!recipient_id(id, name, email, avatar_url)")
    .single();

    if (messageError) {
      // Eliminar el attachment si hay error al enviar el mensaje
      if (attachmentUrl) {
        await b2Client.deleteFileVersion({
          fileId,
          fileName
        });
      }

      throw messageError;
    }

    // Emitir evento de pusher al channel
    await pusher.trigger(`conversation-${combineUuid(userData.user.id, otherUserId)}`, "new-message", messageData);

    return NextResponse.json(messageData);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL enviando mensaje privado: ${message}, code: ${code}`);

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

// Route handler para eliminar un mensaje privado
export async function DELETE(req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
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

    // Buscar el mensaje donde el usuario sea el remitente o el recipiente
    const {data: message, error} = await supabase
      .from("private_messages")
      .select("*")
      .eq("id", messageId)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .limit(1);
    
    // Verificar si hubo error de base de datos al consultar el mensaje
    if (error) {
      throw error;
    }

    // Verificar si el mensaje no existe
    if (!message || message.length === 0) {
      return NextResponse.json({message: "Private message not found"}, {status: 404});
    }

    // Eliminar el mensaje para todos si el mode es "all" y el mensaje pertenece al usuario
    if (mode === "all" && message[0].sender_id === user.id) {
      const {data: updatedMessage, error: updateMessageError} = await supabase
        .from("private_messages")
        .update({
          text_content: "<p class= 'deleted-message'>Message deleted</p>",
          attachment_url: null,
          attachment_key: null,
          attachment_name: null,
          deleted_for_all: true,
          message_type: "text",
          deleted_for_ids: []
        })
        .eq("id", messageId)
        .select("*, recipient:users!recipient_id(id, name, email, avatar_url)")
        .single();

      if (updateMessageError) {
        throw updateMessageError;
      }

      // Eliminar el attachment del storage si existe
      if (updatedMessage.attachment_url) {
        await b2Client.authorize();

        await b2Client.deleteFileVersion({
          fileId: updatedMessage.attachment_key as string,
          fileName: updatedMessage.attachment_name as string
        })
      }

      // Emitir evento de mensaje eliminado a todos los miembros del channel
      await pusher.trigger(
        `conversation-${combineUuid(updatedMessage.recipient_id, updatedMessage.sender_id)}`, 
        "message-deleted", 
        updatedMessage
      );

      return NextResponse.json("success");
    }

    // Eliminar el mensaje para el usuario actual
    if (mode === "me") {
      const deletedFor = message[0].deleted_for_ids || [];

      const {data: updatedMessage, error: updateMessageError} = await supabase
        .from("private_messages")
        .update({
          deleted_for_ids: [...deletedFor, user.id]
        })
        .eq("id", message[0].id)
        .select("*, recipient:users!recipient_id(id, name, email, avatar_url)")
        .single();

      if (updateMessageError) {
        throw updateMessageError;
      }

      updatedMessage.text_content = "<p class= 'deleted-message'>Message deleted</p>";
      updatedMessage.attachment_url = null;
      updatedMessage.attachment_key = null;
      updatedMessage.attachment_name = null;
      updatedMessage.message_type = "text";

      return NextResponse.json(updatedMessage);
    }

    return NextResponse.json(message[0]);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL eliminando el mensaje privado: ${message}, code: ${code}`);

      // Verificar si el error es de mensaje no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Private message not found"}, {status: 404});
      }
    } else {
      console.log(`Error eliminando el mensaje privado`, error.message);
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}