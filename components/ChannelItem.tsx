"use client"

import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { GoHash } from "react-icons/go";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaRegTrashCan } from "react-icons/fa6";
import Typography from "./Typography";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Channel, MessageWithSender, User, } from "@/types/supabase";
import { cn } from "@/lib/utils";

interface Props {
  user: User | null;
  channel: Channel;
  currentChannelId: string;
  deletingChannel: boolean;
  unreadMessages: MessageWithSender[];
  deleteChannelId: string | null;
  setOpenDeleteChannelModal: Dispatch<SetStateAction<boolean>>;
  setDeleteChannelId: Dispatch<SetStateAction<string | null>>;
}

const ChannelItem = ({user, currentChannelId, channel, deletingChannel, unreadMessages, deleteChannelId, setDeleteChannelId, setOpenDeleteChannelModal}: Props) => {
  const unreadCount = unreadMessages.filter((m) => m.channel_id === channel.id).length;
  const isDeleting = deletingChannel && deleteChannelId === channel.id;
  const isActive = currentChannelId === channel.id;

  return (
    <Link
      className={cn("block w-full flex-shrink-0 overflow-hidden", isDeleting && "pointer-events-none opacity-50")}
      href={`/workspace/${channel.workspace_id}/channel/${channel.id}`}
      title={channel.name}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn("flex justify-start items-center gap-1 w-full p-2 rounded-sm cursor-pointer hover:bg-neutral-600 transition-colors", isActive && !isDeleting ? "bg-neutral-950" : isDeleting ? "bg-red-900" : "bg-neutral-700/30" )}>
        <GoHash className="flex-shrink-0" />
        <Typography
          className="w-full flex-grow text-sm text-left truncate"
          variant="p"
          text={channel.name}
        />

        {unreadCount > 0 && (
          <span className="flex justify-center items-center min-w-[24px] h-[24px] p-1.5 flex-shrink-0 text-[12px] font-semibold text-white rounded-full bg-primary-dark">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        
        {user?.id === channel.ws_admin_id && (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isDeleting}
              asChild
            >
              <button
                className="flex justify-center items-center w-6 h-6 flex-shrink-0 rounded-full hover:bg-neutral-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteChannelId(channel.id);
                }}
              >
                <BsThreeDotsVertical />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem
                className="flex justify-start items-center gap-2 cursor-pointer"
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteChannelId(channel.id);
                  setOpenDeleteChannelModal(true);
                }}
              >
                <FaRegTrashCan className="text-red-500" />
                <span>Delete Channel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Link>
  )
}

export default ChannelItem