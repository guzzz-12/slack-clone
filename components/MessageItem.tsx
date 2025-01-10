import { Dispatch, SetStateAction, useState } from "react";
import axios, { isAxiosError } from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { FaPencil, FaRegFilePdf, FaRegTrashCan } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { MessageWithSender } from "@/types/supabase";
import { PaginatedMessages } from "@/types/paginatedMessages";
import { cn } from "@/lib/utils";
import ImageLightbox from "./ImageLightbox";
import { FiZoomIn } from "react-icons/fi";

interface Props {
  currentUserId: string;
  message: MessageWithSender;
  setMessages: Dispatch<SetStateAction<PaginatedMessages>>
}

const MessageItem = ({message, currentUserId, setMessages}: Props) => {
  const isSender = message.sender_id === currentUserId;

  const [isLighboxOpen, setIsLightboxOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteMessageHandler = async(mode: "all" | "me") => {
    try {
      setDeleting(true);

      const {data} = await axios<MessageWithSender>({
        method: "DELETE",
        url: `/api/workspace/${message.workspace_id}/channels/${message.channel_id}/messages/`,
        params: {messageId: message.id, mode}
      });

      // Actualizar el state local de los mensajes
      if (mode === "me") {
        setMessages((prev) => {
          const updatedMessages = [...prev.messages];
          const messageIndex = updatedMessages.findIndex(m => m.id === message.id);
  
          if (messageIndex !== -1) {
            updatedMessages.splice(messageIndex, 1, data);
          }
  
          return {...prev, messages: updatedMessages};
        });
      }
      
    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }

      toast.error(message);

    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      id={message.id}
      className={cn("flex w-full p-2", isSender ? "justify-end gap-1 ml-auto" : "justify-start gap-2 mr-auto")}
    >
      <ImageLightbox
        isOpen={isLighboxOpen}
        setIsOpen={setIsLightboxOpen}
        message={message}
      />

      {/* Mostrar el avatar del otro usuario (no del usuario actual) */}
      {!isSender && (
        <div className="flex justify-center items-start"
        >
          <img
            className="w-8 h-8 object-cover object-center rounded-full border"
            src={message.sender.avatar_url || ""}
            alt={`${message.sender.name} avatar`}
          />
        </div>
      )}

      {/* Mostrar el contenido del mensage y la fecha debajo */}
      <div className="flex flex-col gap-1 min-w-[80px] max-w-[80%] overflow-hidden">
        {!isSender &&
          <p className="text-sm text-neutral-400 truncate">
            {message.sender.name ?? message.sender.email}
          </p>
        }

        {message.text_content &&
          <div
            className="px-4 py-2 text-sm border rounded-lg bg-neutral-950 overflow-x-auto scrollbar-thin message-text-content"
            dangerouslySetInnerHTML={{
              __html: message.text_content
            }}
          />
        }

        {message.message_type === "image" &&
          <div className="relative min-w-[80px] px-4 py-2 text-sm border rounded-lg bg-neutral-950 overflow-hidden group">
            <button
              className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-neutral-900/0 group-hover:bg-neutral-900/80 transition-colors cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
            >
              <FiZoomIn className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" size={30} />
            </button>
            <img
              className="w-full max-w-[200px] h-auto object-contain object-center"
              src={message.attachment_url!}
              alt="Imagen de mensaje"
            />
          </div>
        }

        {message.message_type === "pdf" &&
          <div className="flex justify-center items-center w-[150px] aspect-video border rounded-md">
            <FaRegFilePdf className="text-neutral-400" size={30} />
          </div>
        }

        <span
          className={cn("block w-full text-[10px] text-neutral-400", message.sender_id === currentUserId ? "pr-2 text-right" : "pl-2 text-left")}
          title={dayjs(message.created_at).format("DD/MM/YYYY - HH:mm:ss")}
        >
          {dayjs(message.created_at).format("DD/MM/YYYY")}
        </span>
      </div>

      {!message.deleted_for_all && !message.deleted_for_ids?.includes(currentUserId) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn("flex justify-center items-center w-6 h-6 rounded-full hover:bg-neutral-800 transition-colors", isSender ? "-order-1" : "order-none")}
              disabled={deleting}
            >
              <BsThreeDotsVertical />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            {isSender &&
              <>
                <DropdownMenuItem
                  className="flex justify-start items-center gap-2 cursor-pointer"
                  disabled={deleting}
                >
                  <FaPencil />
                  <span>Edit</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
              </>
            }
            
            <DropdownMenuItem
              className="flex justify-start items-center gap-2 cursor-pointer"
              disabled={deleting}
              onClick={() => deleteMessageHandler("me")}
            >
              <FaTimes className="text-red-500" />
              <span>Delete for you</span>
            </DropdownMenuItem>

            {isSender &&
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="flex justify-start items-center gap-2 cursor-pointer"
                  disabled={deleting}
                  onClick={() => deleteMessageHandler("all")}
                >
                  <FaRegTrashCan className="text-red-500" />
                  <span>Delete for all</span>
                </DropdownMenuItem>
              </>
            }
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export default MessageItem