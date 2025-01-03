"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { LuLoader2 } from "react-icons/lu";
import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import MessageItem from "@/components/MessageItem";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/hooks/useUser";
import { useSocket } from "@/providers/WebSocketProvider";
import { pageBaseTitle } from "@/utils/constants";
import { Channel, MessageWithSender, Workspace, WorkspaceWithMembers } from "@/types/supabase";
import { PaginatedMessages } from "@/types/paginatedMessages";
import { FaArrowDown } from "react-icons/fa6";

interface Props {
  params: {
    workspaceId: string;
    channelId: string;
  }
}

const ChannelPage = ({params}: Props) => {
  const chatInputRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const previousPageLastMessageIdRef = useRef<string>("");

  const {workspaceId, channelId} = params;
  
  const router = useRouter();

  const [channelData, setChannelData] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<PaginatedMessages>({
    messages: [],
    hasMore: true
  });
  const [page, setPage] = useState(1);
  const [newIncomingMessage, setNewIncomingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [chatInputHeight, setChatInputHeight] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const {socket} = useSocket();

  const {user} = useUser();

  const {
    currentWorkspace,
    setLoadingWorkspaces,
    setCurrentWorkspace,
    setUserWorkspaces
  } = useWorkspace();


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
    if (socket && channelData) {
      socket.on(`channel:${channelData.id}:message`, (data) => {
        setMessages((prev) => ({
          ...prev,
          messages: [...prev.messages, data],
        }));

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

      socket.on(`channel:${channelData.id}:message-deleted`, (deletedMsg) => {
        setMessages((prev) => {
          const messageIndex = prev.messages.findIndex(m => m.id === deletedMsg.id);

          if (messageIndex !== -1) {
            prev.messages.splice(messageIndex, 1, deletedMsg);
          }

          return {...prev, messages: [...prev.messages]};
        })
      })
    }

    return () => {
      if (socket && channelData) {
        socket.off(`channel:${channelData.id}:message`);
      }
    }
  }, [socket, channelData, isScrolledToBottom]);


  /** Consultar el workspace y sus miembros */
  const fetchWorkspace = async () => {
    try {
      setLoadingWorkspaces(true);

      const currentWorkspace = await axios<WorkspaceWithMembers>(`/api/workspace/${workspaceId}`);
      const userWorkspaces = await axios<Workspace[]>("/api/workspace/user-workspaces");

      setCurrentWorkspace({
        workspaceData: currentWorkspace.data.workspaceData,
        workspaceMembers: currentWorkspace.data.workspaceMembers
      });

      setUserWorkspaces(userWorkspaces.data);

    } catch (error: any) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        toast.error("Workspace not found", {duration: 5000});
        return router.replace("/user-workspaces");
      }

      toast.error(error.message);

    } finally {
      setLoadingWorkspaces(false);
    }
  }

  /** Consultar el channel */
  const getChannel = async () => {
    try {
      setLoading(true);
      setChannelData(null);

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

  /** Consultar y paginar los mensajes asociados al channel */
  const getMessages = async (currentPage: number) => {
    try {
      setLoadingMessages(true);

      const {data} = await axios.get<PaginatedMessages>(`/api/workspace/${workspaceId}/channels/${channelId}/messages?page=${currentPage}`);
      
      // Scrollear a la posición del último mensaje de la página anterior
      if (currentPage > 1) {
        const previousPageLastMessageElement = document.getElementById(messages.messages[0].id)!;
        previousPageLastMessageElement.scrollIntoView();
      }

      // Actualizar el state local de los mensajes
      setMessages((prev) => {
        const currentMessages = [...data.messages, ...prev.messages];
        
        // Filtrar los mensajes duplicados
        const uniqueMessages = currentMessages.reduce((acc, message) => {
          const existingMessage = acc.find(m => m.id === message.id);

          if (!existingMessage) {
            acc.push(message);
          }

          return acc;
        }, [] as MessageWithSender[]);

        return {
          messages: uniqueMessages,
          hasMore: data.hasMore
        };
      });
      
    } catch (error: any) {
      let message = error.message;

      if (error instanceof AxiosError) {
        message = error.response?.data.message;
      }

      toast.error(message);

    } finally {
      setLoadingMessages(false);
    }
  }

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


  // Consultar la primera página de mensajes si ya cargó el channel
  // y calcular el height del main
  useEffect(() => {
    if (channelData && page === 1) {
      getMessages(1)
      .then(() => {
        // Scrollear al bottom del chat
        scrollToBottomHandler();
      })
    }

    if (chatInputRef.current) {
      setChatInputHeight(chatInputRef.current.clientHeight);
    }
  }, [channelData, page, chatInputRef]);
  

  /** Consultar la siguiente página de mensajes al scrollear al top */
  const onScrollHandler = () => {
    if (sectionRef.current) {
      const {scrollTop, clientHeight, scrollHeight} = sectionRef.current;

      // Detectar si scrolleo al top del section
      if (messages.hasMore && scrollTop === 0) {
        getMessages(page + 1);
        setPage(prev => prev + 1);
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


  // Scrollear al bottom del chat al clickear el botón de "You have new messages"
  const scrollToBottomHandler = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollTo({
        top: sectionRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }


  return (
    <main
      style={{contain: "layout"}}
      className="relative flex flex-col flex-grow rounded-r-lg bg-neutral-900 overflow-hidden"
    >
      <ChatHeader
        title={`#${channelData?.name}`}
        loading={loading}
      />

      {!isScrolledToBottom && newIncomingMessage &&
        <button
          style={{bottom: `calc(${chatInputHeight}px + 1rem)`}}
          className="fixed left-[50%] flex justify-center items-center gap-2 translate-x-[-50%] px-3 py-2 rounded-s-md border bg-primary-dark hover:bg-primary-light transition-colors z-30"
          onClick={scrollToBottomHandler}
        >
          <FaArrowDown />
          <p className="text-sm text-white">
            You have new messages
          </p>
        </button>
      }

      <section 
        ref={sectionRef}
        className="w-full flex-grow p-4 overflow-x-hidden overflow-y-auto scrollbar-thin"
        onScroll={onScrollHandler}
      >
        <div className="flex flex-col justify-start gap-3 w-full h-full">
          {!loadingMessages && !messages.hasMore && messages.messages.length > 0 &&
            <div className="flex justify-center items-center w-full">
              <p className="text-sm text-center text-neutral-400 italic">
                End of conversation...
              </p>
            </div>
          }

          {!loadingMessages && !messages.hasMore && messages.messages.length === 0 &&
            <div className="flex justify-center items-center w-full h-full">
              <p className="max-w-full text-xl text-center text-neutral-400">
                This channel is empty
              </p>
            </div>
          }

          {loadingMessages && (
            <div className="flex justify-center items-center w-full">
              <LuLoader2 className="animate-spin" size={20} />
            </div>
          )}

          {messages.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              setMessages={setMessages}
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
          workspaceId={workspaceId}
          channelId={channelId}
          isLoading={loading}
        />
      </section>
    </main>
  )
}

export default ChannelPage