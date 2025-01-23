"use client"

import { useEffect, useRef, useState } from "react";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { LuLoader2 } from "react-icons/lu";
import { FaArrowDown } from "react-icons/fa6";
import { type Channel } from "pusher-js";
import ChatHeader from "@/components/ChatHeader";
import PrivateMessageItem from "@/components/PrivateMessageItem";
import ChatInput from "@/components/ChatInput";
import VideoChat from "@/components/VideoChat";
import { useWorkspace } from "@/hooks/useWorkspace";
import useFetchWorkspace from "@/hooks/useFetchWorkspace";
import { useDebounce } from "@/hooks/useDebounce";
import { useMessages } from "@/hooks/useMessages";
import { useUser } from "@/hooks/useUser";
import useFetchMessages from "@/hooks/useFetchMessages";
import { combineUuid } from "@/utils/constants";
import { pusherClient } from "@/utils/pusherClientSide";
import { PrivateMessageWithSender } from "@/types/supabase";

interface Props {
  params: {
    workspaceId: string;
    userId: string;
  }
}

type UserData = {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  is_away: boolean;
}

const PrivateChatPage = ({params}: Props) => {
  const sectionRef = useRef<HTMLElement>(null);
  const chatInputRef = useRef<HTMLElement>(null);

  const {userId: otherUserId, workspaceId} = params;
  const apiUrl = `/api/workspace/${workspaceId}/private-messages?otherUserId=${otherUserId}`;

  const [otherUserData, setOtherUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newIncomingMessage, setNewIncomingMessage] = useState(false);
  const [chatInputHeight, setChatInputHeight] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [channel, setChannel] = useState<Channel | null>(null);

  const {user} = useUser();
  
  const {fetchWorkspace} = useFetchWorkspace(workspaceId, user);

  const {currentWorkspace} = useWorkspace();
  const {
    messages,
    page,
    hasMore,
    term,
    isVideoCall,
    loadingMessages,
    setPage,
    setMessages,
    setTerm,
    setLoadingMessages
  } = useMessages();

  const {debouncedValue} = useDebounce(term);

  const {getMessages} = useFetchMessages(apiUrl, sectionRef);

  // Scrollear al bottom del chat al clickear el botón de "You have new messages"
  const scrollToBottomHandler = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollTo({
        top: sectionRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }

  /** Obtener los datos del otro usuario de la conversación */
  const getOtherUserData = async () => {
    setOtherUserData(null);
    setLoading(true);
    setLoadingMessages(true);
    setMessages([]);
    setPage(1);

    try {
      const res = await axios<UserData>({
        method: "GET",
        url: `/api/get-user-data`,
        params: {
          workspaceId,
          otherUserId
        }
      });

      setOtherUserData(res.data);
      
    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }

      toast.error(message);

    } finally {
      setLoading(false);
    }
  }


  // Desuscribirse de la conversación privada al cambiar de conversación
  useEffect(() => {
    return () => {
      if (channel) {
        console.log(`Desuscribiendo de ${channel.name}`);
        channel.unsubscribe();
      }
    }
  }, [otherUserId]);

  
  useEffect(() => {
    // Consultar el workspace si no se ha hecho ya
    // Esto es en caso de que se recargue la página
    // del channel y el state del workspace esté vacío
    if (!currentWorkspace && user) {
      fetchWorkspace();
    }

    // Consultar la data del otro usuario de la conversación
    if (currentWorkspace) {
      getOtherUserData();
    }
  }, [otherUserId, currentWorkspace, user]);


  // Consultar los mensajes de la conversación privada
  // Calcular el height del input de chat
  useEffect(() => {
    if (otherUserData && page === 1) {
      getMessages(page, debouncedValue);
    }

    if (otherUserData && chatInputRef.current) {
      setChatInputHeight(chatInputRef.current.clientHeight);
    }
  }, [otherUserData, workspaceId, debouncedValue, page]);


  // Escuchar eventos de mensaje entrante y mensaje eliminado
    useEffect(() => {
      if (!otherUserData || !user) return;

      const channelName = `conversation-${combineUuid(user.id, otherUserData.id)}`;
  
      const channel = pusherClient.subscribe(channelName);

      setChannel(channel);
  
      channel.bind("new-message", (data: PrivateMessageWithSender) => {
        console.log("Nuevo mensaje entrante", data);
        // Notificar nuevo mensaje entrante pero sin agregarlo
        // a la bandeja si el usuario está en modo búsqueda
        if (term.length > 0) {
          return setNewIncomingMessage(true);
        }
  
        setMessages([...messages, data]);
  
        // Scrollear al bottom del chat al recibir un nuevo mensaje
        // si la bandeja está scrolleada al bottom
        if (isScrolledToBottom) {
          setTimeout(() => {
            scrollToBottomHandler();
          }, 300);
  
        } else {
          setNewIncomingMessage(true);
        }
      });
  
      channel.bind("message-deleted", (deletedMsg: PrivateMessageWithSender) => {
        const currentMessages = [...messages];
        const messageIndex = currentMessages.findIndex(m => m.id === deletedMsg.id);
  
        if (messageIndex !== -1) {
          currentMessages.splice(messageIndex, 1, deletedMsg);
        }
  
        setMessages([...currentMessages]);
      });
    }, [otherUserData, isScrolledToBottom, messages, user]);


  /** Consultar la siguiente página de mensajes al scrollear al top */
  const onScrollHandler = () => {
    if (sectionRef.current) {
      const {scrollTop, clientHeight, scrollHeight} = sectionRef.current;

      // Detectar si scrolleo al top del section
      if (hasMore && scrollTop === 0) {
        getMessages(page + 1, debouncedValue);
        setPage(page + 1);
      }

      // Detectar si el usuario ha scrolleado al bottom del section
      if (scrollTop + clientHeight >= (scrollHeight - 100)) {
        setIsScrolledToBottom(true);
        setNewIncomingMessage(false);
      } else {
        setIsScrolledToBottom(false);
      }
    }
  }


  return (
    <main
      style={{contain: "layout"}}
      className="relative flex flex-col flex-grow rounded-r-lg bg-neutral-900 overflow-hidden"
    >
      <ChatHeader
        currentWorkspaceId={params.userId}
        currentChannelId={params.userId}
        title={otherUserData?.name || otherUserData?.email}
        loading={loading}
      />

      {newIncomingMessage && (term.length > 0 || !isScrolledToBottom) &&
        <button
          style={{bottom: `calc(${chatInputHeight}px + 1rem)`}}
          className="fixed left-[50%] flex justify-center items-center gap-2 translate-x-[-50%] px-3 py-2 rounded-s-md border bg-primary-dark hover:bg-primary-light transition-colors z-30"
          onClick={() => {
            if (term.length > 0) {
              setTerm("");
            }
            scrollToBottomHandler();
          }}
        >
          <FaArrowDown />
          <p className="text-sm text-white">
            You have new messages
          </p>
        </button>
      }

      {/* Pantalla del video chat */}
      {isVideoCall && otherUserData && user &&
        <section className="overflow-y-auto scrollbar-thin">
          <VideoChat user={user} chatId={otherUserData.id} />
        </section>
      }

      {/* Pantalla del chat de texto */}
      {!isVideoCall &&
        <>
          <section
            ref={sectionRef}
            className="w-full flex-grow p-4 overflow-x-hidden overflow-y-auto scrollbar-thin"
            onScroll={onScrollHandler}
          >
            <div className="flex flex-col justify-start gap-3 w-full h-full">
              {!loadingMessages && !hasMore && messages.length > 0 &&
                <div className="flex justify-center items-center w-full">
                  <p className="text-sm text-center text-neutral-400 italic">
                    End of conversation...
                  </p>
                </div>
              }

              {!loadingMessages && !hasMore && messages.length === 0 &&
                <div className="flex justify-center items-center w-full h-full">
                  <p className="max-w-full text-xl text-center text-neutral-400">
                    {term.length === 0 ? "This conversation is empty" : "No messages found"}
                  </p>
                </div>
              }

              {loadingMessages && (
                <div className="flex justify-center items-center w-full">
                  <LuLoader2 className="animate-spin" size={20} />
                </div>
              )}

              {!loading && messages.map((message) => (
                <PrivateMessageItem
                  key={message.id}
                  message={message as PrivateMessageWithSender}
                  currentUserId={user?.id || ""}
                />
              ))}
            </div>
          </section>

          <section
            ref={chatInputRef}
            className="w-full flex-shrink-0 bg-neutral-800 overflow-hidden"
          >
            <ChatInput
              apiUrl={apiUrl}
              isLoading={loading}
            />
          </section>
        </>
      }
    </main>
  )
}

export default PrivateChatPage