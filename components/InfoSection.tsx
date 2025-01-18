"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Pusher, {Channel as PusherChannel} from "pusher-js";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa6";
import Typography from "./Typography";
import ChannelItem from "./ChannelItem";
import CreateChannelModal from "./CreateChannelModal";
import IncomingMsgToastContent from "./IncomingMsgToastContent";
import PrivateChatItem from "./PrivateChatItem";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Channel, MessageWithSender, User } from "@/types/supabase";

type Params = {
  workspaceId: string;
  channelId?: string;
}

interface Props {
  userData: User;
}

const InfoSection = ({userData}: Props) => {
  const {workspaceId, channelId} = useParams<Params>()!;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  const [unreadMessages, setUnreadMessages] = useState<MessageWithSender[]>([]);

  const {currentWorkspace, loadingWorkspaces} = useWorkspace();


  // Limpiar el state de los channels cuando se cambie el workspace
  useEffect(() => {
    if (loadingWorkspaces) {
      setChannels([]);
      setLoadingChannels(true);
    }
  }, [loadingWorkspaces]);


  // Consultar los channels del workspace cuando el workspace haya cargado
  useEffect(() => {
    if (currentWorkspace && !loadingWorkspaces) {
      axios<Channel[]>(`/api/workspace/${currentWorkspace.workspaceData.id}/channels`)
      .then((res) => {
        setChannels(res.data);
        setLoadingChannels(false)
      })
      .catch((error: any) => {
        toast.error(error.message);
        setLoadingChannels(false)
      });
    }
  }, [currentWorkspace, loadingWorkspaces]);


  // Consultar los mensajes sin leer de todos los channels
  useEffect(() => {
    axios<MessageWithSender[]>({
      method: "GET",
      url: `/api/workspace/${workspaceId}/unread-messages`,
    })
    .then((res) => {
      setUnreadMessages(res.data);
    })
    .catch((error: any) => {
      toast.error(error.message);
    });
  }, [workspaceId]);


  // Escuchar los eventos de mensajes de los channels
  // y actualizar el state local de los mensajes sin leer
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const pusherChannels: PusherChannel[] = [];

    if (channels.length > 0) {
      channels.forEach((ch) => {
        const channelName = `channel-${ch.id}`;

        const channel = pusher.subscribe(channelName);

        channel.bind("new-message", (data: MessageWithSender) => {
          setUnreadMessages((prev) => [...prev, data]);

          // Mostrar notificación toast cuando se reciba un nuevo mensaje en el channel
          if (channelId !== ch.id) {
            toast.dismiss();
            toast.custom(
              <IncomingMsgToastContent message={data} />,
              {
                duration: 15000
              }
            );
          }
        });

        pusherChannels.push(channel);
      });
    }

    return () => {
      if (pusherChannels.length > 0) {
        pusherChannels.forEach((channel) => {
          channel.unbind_all();
          channel.unsubscribe();
        });
      }
    }
  }, [channels, workspaceId, channelId]);


  return (
    <aside className="flex flex-col justify-start items-center w-[270px] flex-shrink-0 p-4 bg-neutral-800 rounded-l-lg border-r border-neutral-900">
      {loadingChannels && (
        <>
          <div className="flex justify-between items-center w-full mb-4">
            <Skeleton className="w-[60%] h-5 bg-neutral-600" />
            <Skeleton className="w-8 h-8 rounded-full bg-neutral-600" />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
          </div>
        </>
      )}

      {!loadingChannels && !loadingWorkspaces && (
        <div className="flex flex-col gap-2 w-full max-h-[50vh]">
          <CreateChannelModal
            userId={userData.id}
            isOpen={isChannelModalOpen}
            setIsOpen={setIsChannelModalOpen}
            setChannels={setChannels}
          />

          <div className="flex justify-between items-center w-full">
            <Typography
              className="font-bold"
              variant="p"
              text="Channels"
            />

            {currentWorkspace?.workspaceData.admin_id === userData.id && (
              <Button
                className="w-8 h-8 p-1 flex-shrink-0 rounded-full hover:bg-neutral-900 group"
                variant="outline"
                onClick={() => setIsChannelModalOpen(true)}
              >
                <FaPlus className="group-hover:scale-125 transition-transform" />
              </Button>
            )}
          </div>

          {/* Renderizar los channels del workspace */}
          <div className="flex flex-col gap-1 w-full scrollbar-thin overflow-y-auto">
            {channels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                currentChannelId={channelId!}
                unreadMessages={unreadMessages}
              />
            ))}
          </div>
        </div>
      )}

      <Separator className="w-full my-4 bg-neutral-700" />

      {(loadingWorkspaces || loadingChannels) &&
        <>
          <div className="flex justify-between items-center w-full mb-4">
            <Skeleton className="w-[60%] h-5 bg-neutral-600" />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
          </div>
        </>
      }

      {!loadingWorkspaces && !loadingChannels && currentWorkspace &&
        <div className="flex flex-col gap-3 w-full max-h-[50vh]">
          <Typography
            className="font-bold"
            variant="p"
            text="Direct Messages"
          />

          <div className="flex flex-col gap-1 scrollbar-thin overflow-y-auto">
            {currentWorkspace.workspaceMembers.map((member) => (
              <PrivateChatItem
                key={member.id}
                workspaceId={workspaceId}
                user={member}
              />
            ))}
          </div>
        </div>
      }
    </aside>
  )
}

export default InfoSection