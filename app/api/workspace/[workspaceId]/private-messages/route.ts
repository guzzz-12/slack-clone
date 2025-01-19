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
    .select("*")
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
    await pusher.trigger(`private-message-${combineUuid(userData.user.id, otherUserId)}`, "new-private-message", messageData);

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