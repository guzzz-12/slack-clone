import { NextApiRequest } from "next";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { getUserData } from "@/utils/supabasePagesRouter/getUserData";
import { supabaseServerClientPages } from "@/utils/supabasePagesRouter/supabaseServerClientPages";
import { SocketApiResponse } from "@/types/socket";

// Endpoint para crear un mensaje utilizando pages-router
// para que sea compatible con socket.io
export default async function handler(req: NextApiRequest, res: SocketApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({message: "Method not allowed"});
    }

    const userData = await getUserData(req, res);

    const supabase = supabaseServerClientPages(req, res);

    const {textContent, channelId, workspaceId, attachmentUrl} = req.body;

    // Validar el textContent y el attachmentUrl
    if (!textContent?.trim() && !attachmentUrl.trim()) {
      return res.status(400).json({message: "The message cannot be empty"});
    }

    // Validar el channelId
    if (!uuidRegex.test(channelId)) {
      return res.status(404).json({message: "Channel not found"});
    }

    // Validar el workspaceId
    if (!uuidRegex.test(workspaceId)) {
      return res.status(404).json({message: "Workspace not found"});
    }

    // Crear el mensaje en la base de datos
    const {data: message, error} = await supabase
      .from("messages")
      .insert({
        sender_id: userData.id,
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

    // Emitir evento de nuevo mensaje a los miembros del channel
    res.socket.server.io.emit(`channel:${channelId}:message`, {...message, sender: message.sender!});

    return res.json(message);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL enviando el mensaje: ${message}, code: ${code}`);

      // Verificar si el error es de user no encontrado
      if (code === "PGRST116") {
        return res.json({message: "User not found"});
      }
    } else {
      console.log(`Error enviando mensaje`, error.message);
    }

    return res.status(500).json({message: "Internal server error"});
  }
}