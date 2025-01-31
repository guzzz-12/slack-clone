"use client"

import { Dispatch, SetStateAction, useState } from "react";
import Link from "next/link";
import { GoHash } from "react-icons/go";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaRegTrashCan } from "react-icons/fa6";
import Typography from "./Typography";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const unreadCount = unreadMessages.filter((m) => m.channel_id === channel.id).length;
  const isDeleting = deletingChannel && deleteChannelId === channel.id;
  const isActive = currentChannelId === channel.id;

  return (
    <Link
      className={cn("block w-full flex-shrink-0 overflow-hidden", isDeleting && "pointer-events-none opacity-50")}
      href={`/workspace/${channel.workspace_id}/channel/${channel.id}`}
      title={channel.name}
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
          <Popover
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          >
            <PopoverTrigger
              disabled={isDeleting}
              asChild
            >
              <button
                className="flex justify-center items-center w-6 h-6 flex-shrink-0 rounded-full hover:bg-neutral-800 transition-colors"
                aria-labelledby="channel-options-label"
                onClick={(e) => {
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                <span
                  id="channel-options-label"
                  className="sr-only"
                >
                  Channel options
                </span>
                <BsThreeDotsVertical aria-hidden />
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-1">
              <Button
                className="flex justify-start items-center gap-2 w-full cursor-pointer"
                variant="ghost"
                disabled={isDeleting}
                onClick={(e) => {
                  setIsPopoverOpen(false);
                  setDeleteChannelId(channel.id);
                  setOpenDeleteChannelModal(true);
                }}
              >
                <FaRegTrashCan className="text-red-500" aria-hidden />
                <span>Delete Channel</span>
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </Link>
  )
}

export default ChannelItem