"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Link from "next/link";
import { GoHash } from "react-icons/go";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaRegTrashCan } from "react-icons/fa6";
import { HiUserGroup } from "react-icons/hi2";
import Typography from "./Typography";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { pusherClient } from "@/utils/pusherClientSide";
import { useMessages } from "@/hooks/useMessages";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";
import { Channel, MessageWithSender, User, } from "@/types/supabase";

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

const ChannelItem = ({ user, currentChannelId, channel, deletingChannel, unreadMessages, deleteChannelId, setDeleteChannelId, setOpenDeleteChannelModal }: Props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { workspaceChannels, setWorkspaceChannels, setCurrentChannel } = useWorkspace();
  const { setCallerId, setVideoCallType } = useMessages();

  const isChannelActive = currentChannelId === channel.id;
  const isDeletingChannel = deletingChannel && deleteChannelId === channel.id;

  const unreadMesaggesCount = isChannelActive ? 0 : unreadMessages.filter((m) => m.channel_id === channel.id).length;

  // Escuchar eventos de video llamada (reunión)
  useEffect(() => {
    if (channel) {
      setCurrentChannel(channel);
    }

    const pusherChannel = pusherClient.subscribe(`videocall-${channel.id}-${channel.workspace_id}`);

    pusherChannel.bind("member-connected", ({ meetingChannel }: { meetingChannel: Channel }) => {
      const channelIndex = workspaceChannels.findIndex((ch) => ch.id === meetingChannel.id);

      if (channelIndex !== -1) {
        const updatedChannels = [...workspaceChannels];
        updatedChannels.splice(channelIndex, 1, meetingChannel);
        setWorkspaceChannels(updatedChannels);
        setCallerId(meetingChannel.id);
        setVideoCallType("channel");
      }
    });

    pusherChannel.bind("member-disconnected", ({ meetingChannel }: { meetingChannel: Channel }) => {
      const channelIndex = workspaceChannels.findIndex((ch) => ch.id === meetingChannel.id);

      if (channelIndex !== -1) {
        const updatedChannels = [...workspaceChannels];
        updatedChannels.splice(channelIndex, 1, meetingChannel);
        setWorkspaceChannels(updatedChannels);

        const updatedConnectedMembers = meetingChannel.meeting_members;
        const isCurrentUserConnected = !!updatedConnectedMembers.find((memberId) => memberId === user!.id);

        // Mostrar el chat de texto si no hay miembros conectados en la conferencia o si el usuario actual se desconecta de la conferencia
        if (!isCurrentUserConnected || updatedConnectedMembers.length === 0) {
          setCallerId(null);
          setVideoCallType(null);
        }
      }
    });

    return () => {
      pusherChannel.unsubscribe();
    };
  }, [channel, currentChannelId, workspaceChannels, user]);

  return (
    <Link
      className={cn("block w-full flex-shrink-0 overflow-hidden", isDeletingChannel && "pointer-events-none opacity-50")}
      href={`/workspace/${channel.workspace_id}/channel/${channel.id}`}
      title={channel.name}
    >
      <div className={cn("flex justify-start items-center gap-1 w-full p-2 rounded-sm cursor-pointer hover:bg-neutral-600 transition-colors", isChannelActive && !isDeletingChannel ? "bg-neutral-950" : isDeletingChannel ? "bg-red-900" : "bg-neutral-700/30")}>
        {channel.meeting_members.length === 0 && <GoHash className="flex-shrink-0" />}

        {channel.meeting_members.length > 0 &&
          <div className="relative flex justify-center items-center mr-2 ml-1 flex-shrink-0 rounded-full">
            <div className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-green-500 opacity-75 z-10" />
            <HiUserGroup className="relative block w-4 h-4 flex-shrink-0 text-white z-20" />
          </div>
        }
        <Typography
          className="w-full flex-grow text-sm text-left truncate"
          variant="p"
          text={channel.name}
        />

        {unreadMesaggesCount > 0 && (
          <span className="flex justify-center items-center min-w-[24px] h-[24px] p-1.5 flex-shrink-0 text-[12px] font-semibold text-white rounded-full bg-primary-dark">
            {unreadMesaggesCount > 99 ? "99+" : unreadMesaggesCount}
          </span>
        )}

        {user?.id === channel.ws_admin_id && (
          <Popover
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          >
            <PopoverTrigger
              disabled={isDeletingChannel}
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
                disabled={isDeletingChannel}
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