"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { LuLoader2 } from "react-icons/lu";
import { FaArrowDown } from "react-icons/fa6";
import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import MessageItem from "@/components/MessageItem";
import VideoChat from "@/components/VideoChat";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/hooks/useUser";
import { useMessages } from "@/hooks/useMessages";
import { useDebounce } from "@/hooks/useDebounce";
import useFetchWorkspace from "@/hooks/useFetchWorkspace";
import useFetchMessages from "@/hooks/useFetchMessages";
import { pageBaseTitle } from "@/utils/constants";
import { pusherClient } from "@/utils/pusherClientSide";
import { Channel, MessageWithSender } from "@/types/supabase";

interface Props {
  params: {
    workspaceId: string;
    channelId: string;
  }
}

const ChannelPage = ({params}: Props) => {
  const chatInputRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const {workspaceId, channelId} = params;
  
  const router = useRouter();

  const [channelData, setChannelData] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [newIncomingMessage, setNewIncomingMessage] = useState(false);
  const [chatInputHeight, setChatInputHeight] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const {
    messages,
    loadingMessages,
    hasMore,
    page,
    term,
    isVideoCall,
    setTerm,
    setPage,
    setMessages,
    setLoadingMessages
  } = useMessages();

  const {user} = useUser();

  const {debouncedValue} = useDebounce(term);

  const {fetchWorkspace} = useFetchWorkspace(workspaceId);

  const {currentWorkspace} = useWorkspace();

  // API endpoint para consultar, enviar y eliminar los mensajes
  const apiUrl = `/api/workspace/${workspaceId}/channels/${channelId}/messages`;

  const {getMessages} = useFetchMessages(apiUrl, sectionRef);


  /** Scrollear al bottom del chat al clickear el botón de "You have new messages" */
  const scrollToBottomHandler = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollTo({
        top: sectionRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }


  /** Consultar el channel */
  const getChannel = async () => {
    try {
      setLoading(true);
      setChannelData(null);
      setMessages([]);
      setLoadingMessages(true);
      setPage(1);

      const {data} = await axios.get<Channel>(`/api/workspace/${workspaceId}/channels/${channelId}`);

      setChannelData(data);

    } catch (error: any) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        if (error.response.data.message.toLowerCase().includes("channel")) {
          toast.error("Channel not found", {duration: 5000});
          return router.replace(`/workspace/${workspaceId}`);
        };

        toast.error("Workspace not found");
        return router.replace("/user-workspaces");
      }

      toast.error(error.message);
      
    } finally {
      setLoading(false);
    }
  }


  // Actualizar el title de la página al cambiar de channel
  useEffect(() => {
    if (channelData) {
      document.title = `${pageBaseTitle} | #${channelData.name}`;
    } else {
      document.title = pageBaseTitle;
    }
  }, [channelData]);


  // Escuchar el eventos de mensaje entrante y mensaje eliminado
  useEffect(() => {
    if (!channelData) return;

    const channelName = `channel-${channelData.id}`;

    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-message", (data: MessageWithSender) => {
      // Notificar nuevo mensaje entrante pero sin agregarlo
      // a la bandeja si el usuario está en modo búsqueda
      if (term.length > 0) {
        return setNewIncomingMessage(true);
      }

      setMessages([...messages as MessageWithSender[], data]);

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

    channel.bind("message-deleted", (deletedMsg: MessageWithSender) => {
      const currentMessages = [...messages];
      const messageIndex = currentMessages.findIndex(m => m.id === deletedMsg.id);

      if (messageIndex !== -1) {
        currentMessages.splice(messageIndex, 1, deletedMsg);
      }

      setMessages([...currentMessages as MessageWithSender[]]);
    })

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [channelData, isScrolledToBottom, messages, pusherClient]);


  // Consultar el channel y workspace con sus miembros
  useEffect(() => {
    // Consultar el workspace si no se ha hecho ya
    // Esto es en caso de que se recargue la página
    // del channel y el state del workspace esté vacío
    if (!currentWorkspace) {
      fetchWorkspace();
    }

    // Consultar el channel si ya cargó el workspace
    if (currentWorkspace) {
      getChannel();
    }
  }, [workspaceId, channelId, currentWorkspace]);


  // Consultar la primera página de mensajes
  // Calcular el height del main
  useEffect(() => {
    if (channelData && page === 1) {
      getMessages(page, debouncedValue)
    }

    if (channelData && chatInputRef.current) {
      setChatInputHeight(chatInputRef.current.clientHeight);
    }
  }, [channelData, chatInputRef, debouncedValue, page]);


  // Restablecer el page al cambiar el term
  useEffect(() => {
    return () => {
      setPage(1);
    }
  }, [debouncedValue]);
  

  /** Consultar las siguientes páginas de mensajes al scrollear al top */
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
        currentWorkspaceId={workspaceId}
        currentChannelId={channelId}
        title={channelData?.name}
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
      {isVideoCall && channelData && user &&
        <section className="overflow-y-auto scrollbar-thin">
          <VideoChat user={user} chatId={channelData.id} />
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
                    {term.length === 0 ? "This channel is empty" : "No results found"}
                  </p>
                </div>
              }

              {loadingMessages && (
                <div className="flex justify-center items-center w-full">
                  <LuLoader2 className="animate-spin" size={20} />
                </div>
              )}

              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message as MessageWithSender}
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

export default ChannelPage