import { useState } from "react";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { useMessages } from "./useMessages";
import { Message } from "@/types/supabase";

/** Custom hook para borrar un mensaje de un channel o de una conversación privada */
const useDeleteMessages = (apiDeleteUrl: string, message: Message, messages: Message[]) => {
  const [deleting, setDeleting] = useState(false);

  const {setMessages} = useMessages();

  const deleteMessageHandler = async(mode: "all" | "me") => {
    try {
      setDeleting(true);

      const {data} = await axios<Message>({
        method: "DELETE",
        url: apiDeleteUrl,
        params: {
          messageId: message.id,
          mode
        }
      });

      // Actualizar el state local de los mensajes
      if (mode === "me") {
        const updatedMessages = [...messages];
        const messageIndex = updatedMessages.findIndex(m => m.id === message.id);

        if (messageIndex !== -1) {
          updatedMessages.splice(messageIndex, 1, data);
        }

        setMessages(updatedMessages);
      }
      
    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }

      toast.error(message, {ariaProps: {role: "alert", "aria-live": "assertive"}});

    } finally {
      setDeleting(false);
    }
  }

  return {
    deleting,
    deleteMessageHandler
  }
}

export default useDeleteMessages