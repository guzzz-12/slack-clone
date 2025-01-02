import { NextApiRequest } from "next";
import { redirect } from "next/navigation";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClientPages } from "@/utils/supabasePagesRouter/supabaseServerClientPages";
import { SocketApiResponse } from "@/types/socket";

type QueryParams = {
  workspaceId: string;
  channelId: string;
  messageId: string;
  mode: "all" | "me";
}

// Route handler para eliminar un mensaje y emitir evento de mensaje eliminado
export default async function handler(req: NextApiRequest, res: SocketApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({message: "Method not allowed"});
    }

    // req.query incluye los segmentos dinámicos y el query string
    const {workspaceId, channelId, messageId, mode} = req.query as QueryParams;

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return res.status(404).json({message: "Workspace not found"});
    }

    // Validar la ID del channel
    if (!uuidRegex.test(channelId)) {
      return res.status(404).json({message: "Channel not found"});
    }

    // Validar el mode
    if (mode !== "all" && mode !== "me") {
      return res.status(400).json({message: "Invalid deletion mode: must be 'all' or 'me'"})
    }

    const supabase = supabaseServerClientPages(req, res);

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
      return res.status(404).json({message: "Message not found"});
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
      res.socket.server.io.emit(`channel:${channelId}:message-deleted`, {
        ...updatedMessage,
        sender: updatedMessage.sender!
      });

      return res.json("success");
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

      return res.json(updatedMessage);
    }

    return res.json(message);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL eliminando el mensaje: ${message}, code: ${code}`);

      // Verificar si el error es de mensaje no encontrado
      if (code === "PGRST116") {
        return res.json({message: "Message not found"});
      }
    } else {
      console.log(`Error eliminando el mensaje`, error.message);
    }

    return res.status(500).json({message: "Internal server error"});
  }
}