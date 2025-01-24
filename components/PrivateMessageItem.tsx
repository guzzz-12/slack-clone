import Link from "next/link";
import dayjs from "dayjs";
import { FaPencil, FaRegFilePdf, FaRegTrashCan } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiDownload, FiZoomIn } from "react-icons/fi";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { PrivateMessageWithSender } from "@/types/supabase";
import { useMessages } from "@/hooks/useMessages";
import { useImageLightbox } from "@/hooks/useImageLightbox";
import useDeleteMessages from "@/hooks/useDeleteMessages";
import { cn } from "@/lib/utils";

interface Props {
  currentUserId: string;
  message: PrivateMessageWithSender;
}

const PrivateMessageItem = ({message, currentUserId}: Props) => {
  const isSender = message.sender_id === currentUserId;

  const {messages} = useMessages();

  const {setMessage, setOpen} = useImageLightbox();

  // URL de la API para borrar un mensaje de la conversación privada
  let apiDeleteUrl = `/api/workspace/${message.workspace_id}/private-messages`

  // Handler para eliminación de un mensaje
  const {deleteMessageHandler, deleting} = useDeleteMessages(apiDeleteUrl, message, messages);

  return (
    <div
      id={message.id}
      className={cn("flex w-full p-2", isSender ? "justify-end gap-1 ml-auto" : "justify-start gap-2 mr-auto")}
    >
      {/* Mostrar el avatar del otro usuario (no del usuario actual) */}
      {!isSender && (
        <div className="flex justify-center items-start"
        >
          <img
            className="w-8 h-8 text-xs object-cover object-center rounded-full border"
            src={message.recipient.avatar_url || ""}
            alt={`${message.recipient.name} avatar`}
          />
        </div>
      )}

      {/* Mostrar el contenido del mensage y la fecha debajo */}
      <div className="flex flex-col gap-1 min-w-[80px] max-w-[80%] overflow-hidden">
        {!isSender &&
          <p className="text-sm text-neutral-400 truncate">
            {message.recipient.name ?? message.recipient.email}
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
              onClick={() => {
                setOpen(true);
                setMessage(message);
              }}
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
          <div className="relative flex justify-center items-center w-[150px] aspect-video border rounded-md group">
            <Link
              className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-neutral-900/0 group-hover:bg-neutral-900/100 transition-colors cursor-pointer z-10"
              href={message.attachment_url!}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <FiDownload
                className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
                size={30}
              />
            </Link>
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

export default PrivateMessageItem