"use client"

import Link from "next/link";
import toast from "react-hot-toast";
import { FaRegFilePdf } from "react-icons/fa6";
import Typography from "./Typography";
import { MessageWithSender } from "@/types/supabase"

interface Props {
  message: MessageWithSender;
}

const IncomingMsgToastContent = ({message}: Props) => {
  return (
    <Link
      className="flex gap-2 w-[240px] px-4 py-3 border rounded-md bg-neutral-900"
      href={`/workspace/${message.workspace_id}/channel/${message.channel_id}`}
      onClick={() => toast.dismiss()}
    >
      <div className="flex flex-col justify-start h-full flex-shrink-0">
        <img
          className="block w-[30px] h-[30px] object-cover object-center rounded-full" 
          src={message.sender.avatar_url!}
          alt={message.sender.name || message.sender.email}
        />
      </div>

      <div className="flex flex-col justify-start gap-2 flex-grow">
        <Typography
          className="text-sm"
          variant="p"
          text={message.sender.name || message.sender.email}
        />

        {/* Mostrar el contenido de texto si es de texto */}
        {message.text_content &&
          <div
            className="text-sm text-neutral-600"
            dangerouslySetInnerHTML={{__html: message.text_content.substring(0, 100) + (message.text_content.length > 100 ? "..." : "")}}
          />
        }

        {/* Mostrar la imagen si es mensaje de imagen */}
        {message.message_type === "image" &&
          <img
            className="block w-full aspect-video object-cover object-center rounded-md" 
            src={message.attachment_url!}
            alt={message.sender.name || message.sender.email}
          />
        }

        {message.message_type === "pdf" &&
          <div className="flex justify-center items-center w-full aspect-video border rounded-md">
            <FaRegFilePdf className="text-neutral-400" size={30} />
          </div>
        }
      </div>
    </Link>
  )
}

export default IncomingMsgToastContent