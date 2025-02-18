import { RefObject } from "react";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { useMessages } from "./useMessages";
import { Message, PaginatedMessages } from "@/types/supabase";


/** Hook para obtener los mensajes de un channel o de una conversación privada */
const useFetchMessages = (
  apiUrl: string,
  sectionRef: RefObject<HTMLElement>,
  params?: Record<string, any>
) => {
  const {
      messages,
      setMessages,
      setHasMore,
      setLoadingMessages
    } = useMessages();

  /** Scrollear al bottom del chat */
  const scrollToBottomHandler = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollTo({
        top: sectionRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }

  const getMessages = async (currentPage: number, searchTerm: string | null) => {
    try {
      setLoadingMessages(true);

      const {data} = await axios<PaginatedMessages<Message>>({
        method: "GET",
        url: apiUrl,
        params: {
          ...params,
          searchTerm,
          page: currentPage
        }
      });
      
      // Scrollear a la posición del último mensaje de la página anterior
      if (currentPage > 1) {
        const previousPageLastMessageElement = document.getElementById(messages[0].id)!;
        previousPageLastMessageElement.scrollIntoView();
      }

      let currentMessages: Message[] = [];

      // Actualizar el state de los mensajes
      if (currentPage === 1) {
        currentMessages = data.messages;
      } else {
        currentMessages = [...data.messages, ...messages];
      }      

      // Filtrar los mensajes duplicados
      const uniqueMessages = currentMessages.reduce((acc, message) => {
        const existingMessage = acc.find(m => m.id === message.id);

        if (!existingMessage) {
          acc.push(message);
        }

        return acc;
      }, [] as Message[]);

      setMessages(uniqueMessages);
      setHasMore(data.hasMore);

      // Scrollear al fondo del chat al cargar la primera página de mensajes
      if (currentPage === 1) {
        setTimeout(() => {
          scrollToBottomHandler();
        }, 500);
      }
      
    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }

      toast.error(message, {ariaProps: {role: "alert", "aria-live": "assertive"}});

    } finally {
      setLoadingMessages(false);
    }
  }

  return {getMessages};
}

export default useFetchMessages