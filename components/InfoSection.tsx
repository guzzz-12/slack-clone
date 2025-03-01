"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import { type Channel as PusherChannel } from "pusher-js";
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
import ConfirmationModal from "./ConfirmationModal";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/hooks/useUser";
import { pusherClient } from "@/utils/pusherClientSide";
import { combineUuid } from "@/utils/constants";
import { Channel, MessageWithSender, PrivateMessageWithSender } from "@/types/supabase";

type Params = {
  workspaceId: string;
  channelId?: string;
}

const InfoSection = () => {
  const router = useRouter();

  const { workspaceId, channelId } = useParams<Params>()!;

  const [loadingChannels, setLoadingChannels] = useState(true);

  const [openDeleteChannelModal, setOpenDeleteChannelModal] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState(false);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);

  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  const [unreadChannelMessages, setUnreadChannelMessages] = useState<MessageWithSender[]>([]);
  const [unreadPrivateChatMessages, setUnreadPrivateChatMessages] = useState<PrivateMessageWithSender[]>([]);

  const { user } = useUser();
  const { workspaceChannels, currentWorkspace, loadingWorkspaces, setWorkspaceChannels } = useWorkspace();


  // Limpiar el state de los channels cuando se cambie el workspace
  useEffect(() => {
    if (loadingWorkspaces) {
      setWorkspaceChannels([]);
      setLoadingChannels(true);
    }
  }, [loadingWorkspaces]);


  // Consultar los channels del workspace cuando el workspace haya cargado
  useEffect(() => {
    if (currentWorkspace && !loadingWorkspaces) {
      const workspaceId = currentWorkspace.workspaceData.id;

      axios<Channel[]>(`/api/workspace/${workspaceId}/channels`)
        .then((res) => {
          setWorkspaceChannels(res.data);
          setLoadingChannels(false)
        })
        .catch((error: any) => {
          toast.error(error.message, { ariaProps: { role: "alert", "aria-live": "assertive" } });
          setLoadingChannels(false)
        });
    }
  }, [currentWorkspace, loadingWorkspaces]);


  // Consultar los mensajes sin leer de todos los channels
  // Escuchar evento de channel eliminado en el workspace
  useEffect(() => {
    axios<MessageWithSender[]>({
      method: "GET",
      url: `/api/workspace/${workspaceId}/unread-messages`,
      params: {
        messageType: "channel"
      }
    })
      .then((res) => {
        setUnreadChannelMessages(res.data);
      })
      .catch((error: any) => {
        toast.error(error.message, { ariaProps: { role: "alert", "aria-live": "assertive" } });
      });
  }, [workspaceId, channelId, user]);


  // Escuchar los eventos de los channels
  useEffect(() => {
    if (currentWorkspace) {
      const pusherChannel = pusherClient.subscribe(`workspace-${workspaceId}`);

      // Escuchar evento de nuevo channel creado en el workspace
      pusherChannel.bind("new-channel", (newChannel: Channel) => {
        if (user?.id !== newChannel.ws_admin_id) {
          setWorkspaceChannels([...workspaceChannels, newChannel]);
          toast.success(`A new channel (${newChannel.name}) was created on ${currentWorkspace.workspaceData.name}`, { duration: 10000 });
        }
      });

      // Escuchar los eventos de channel eliminado en el workspace
      pusherChannel.bind("channel-deleted", (data: Channel) => {
        // Eliminar el channel de la lista de channels
        setWorkspaceChannels([...workspaceChannels].filter((ch) => ch.id !== data.id));

        if (user?.id !== data.ws_admin_id) {
          toast.error(`Channel ${data.name} was deleted by the admin`, { ariaProps: { role: "alert", "aria-live": "assertive" } });
        }

        // Si el channel eliminado es el channel actual, salir del channel
        if (data.id === channelId) {
          router.replace(`/workspace/${workspaceId}`);
        }
      });

      return () => {
        pusherChannel.unsubscribe();
      }
    }

  }, [currentWorkspace, user, workspaceChannels, channelId]);


  // Escuchar los eventos de mensajes de los channels
  // y actualizar el state de los mensajes sin leer
  useEffect(() => {
    const pusherChannels: PusherChannel[] = [];

    if (workspaceChannels.length > 0) {
      workspaceChannels.forEach((ch) => {
        const channelName = `channel-${ch.id}`;

        const channel = pusherClient.subscribe(channelName);

        // Escuchar los eventos de mensajes entrantes de los channels
        channel.bind("new-message", (data: MessageWithSender) => {
          setUnreadChannelMessages((prev) => [...prev, data]);

          const messageChannel = workspaceChannels.find((ch) => ch.id === data.channel_id)!;

          // Subir el channel al principio de la lista de channels
          if (messageChannel) {
            const filtered = workspaceChannels.filter((ch) => ch.id !== messageChannel.id);
            const updatedChannels = [messageChannel, ...filtered];
            setWorkspaceChannels(updatedChannels);
          }

          // Mostrar notificación toast cuando se reciba un nuevo mensaje en el channel
          if ((!channelId || channelId !== data.channel_id) && user?.id !== data.sender_id) {
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
          channel.unsubscribe();
        });
      }
    }
  }, [workspaceChannels, channelId, currentWorkspace, user]);


  // Consultar los mensajes sin leer de todos los chats privados
  // Escuchar los eventos de mensajes de los chats privados
  // y actualizar el state local de los mensajes sin leer
  useEffect(() => {
    const pusherChannels: PusherChannel[] = [];

    if (!user || !currentWorkspace) return;

    axios<PrivateMessageWithSender[]>({
      method: "GET",
      url: `/api/workspace/${workspaceId}/unread-messages`,
      params: {
        messageType: "private",
        otherUserId: user.id
      }
    })
      .then((res) => {
        setUnreadPrivateChatMessages(res.data);
      })
      .catch((error: any) => {
        toast.error(error.message, { ariaProps: { role: "alert", "aria-live": "assertive" } });
      });

    // Remover al usuario actual de los miembros del workspace
    const members = currentWorkspace.workspaceMembers.filter((member) => member.id !== user.id);

    members.forEach((member) => {
      const channelName = `conversation-${combineUuid(user.id, member.id)}`;
      const channel = pusherClient.subscribe(channelName);

      channel.bind("new-message", (data: PrivateMessageWithSender) => {
        setUnreadPrivateChatMessages((prev) => [...prev, data]);

        // Mostrar notificación toast cuando se reciba un nuevo mensaje en el chat privado
        if (data.recipient_id === user.id) {
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

    return () => {
      if (pusherChannels.length > 0) {
        pusherChannels.forEach((channel) => {
          channel.unsubscribe();
        });
      }
    }
  }, [currentWorkspace, user]);


  const deleteChannelHandler = async () => {
    if (!deleteChannelId) return;

    try {
      setDeletingChannel(true);

      const { data } = await axios<Channel>({
        method: "DELETE",
        url: `/api/workspace/${workspaceId}/channels/${deleteChannelId}`
      });

      // Eliminar el channel de la lista de channels
      setWorkspaceChannels([...workspaceChannels].filter((ch) => ch.id !== data.id));

      toast.success("Channel deleted successfully");

    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }

      toast.error(message, { ariaProps: { role: "alert", "aria-live": "assertive" } });

    } finally {
      setDeletingChannel(false);
      setOpenDeleteChannelModal(false);
    }
  }


  return (
    <aside
      className="flex flex-col justify-start items-center w-[120px] min-[600px]:w-[180px] min-[900px]:w-[270px] flex-shrink-0 p-4 bg-neutral-800 rounded-l-lg border-r border-neutral-900"
      role="region"
      aria-label="Main Sidebar"
    >
      <ConfirmationModal
        open={openDeleteChannelModal}
        title="Delete Channel"
        description="Are you sure you want to delete this channel?"
        loading={deletingChannel}
        callback={deleteChannelHandler}
        setOpen={setOpenDeleteChannelModal}
      />

      {loadingChannels && (
        <>
          <div className="flex justify-between items-center w-full mb-4">
            <Skeleton className="w-[60%] h-5 bg-neutral-600" />
            <Skeleton className="w-8 h-8 rounded-full bg-neutral-600" />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="w-[80%] h-5 bg-neutral-600" />
            <Skeleton className="w-[80%] h-5 bg-neutral-600" />
            <Skeleton className="w-[80%] h-5 bg-neutral-600" />
          </div>
        </>
      )}

      {!loadingChannels && !loadingWorkspaces && user && (
        <div className="flex flex-col w-full max-h-[50vh]">
          <CreateChannelModal
            userId={user.id}
            isOpen={isChannelModalOpen}
            setIsOpen={setIsChannelModalOpen}
          />

          <div className="flex justify-between items-center w-full">
            <Typography
              className="font-bold"
              variant="p"
              text="Channels"
            />

            {currentWorkspace?.workspaceData.admin_id === user.id && (
              <Button
                className="w-8 h-8 p-1 flex-shrink-0 rounded-full hover:bg-neutral-900 group"
                variant="outline"
                aria-labelledby="channel-modal-label"
                onClick={() => setIsChannelModalOpen(true)}
              >
                <FaPlus className="group-hover:scale-125 transition-transform" aria-hidden />
                <span id="channel-modal-label" hidden>
                  Open create channel modal
                </span>
              </Button>
            )}
          </div>

          {/* Renderizar los channels del workspace */}
          <div className="flex flex-col gap-2 w-full mt-2 p-1 scrollbar-thin overflow-y-auto">
            {workspaceChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                user={user}
                channel={ch}
                currentChannelId={channelId!}
                unreadMessages={unreadChannelMessages}
                deleteChannelId={deleteChannelId}
                deletingChannel={deletingChannel}
                setDeleteChannelId={setDeleteChannelId}
                setOpenDeleteChannelModal={setOpenDeleteChannelModal}
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
            <Skeleton className="w-[80%] h-5 bg-neutral-600" />
            <Skeleton className="w-[80%] h-5 bg-neutral-600" />
            <Skeleton className="w-[80%] h-5 bg-neutral-600" />
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

          <div className="flex flex-col gap-2 p-1 scrollbar-thin overflow-y-auto">
            {currentWorkspace.workspaceMembers.map((member) => (
              <PrivateChatItem
                key={member.id}
                workspaceId={workspaceId}
                member={member}
                unreadMessages={unreadPrivateChatMessages}
              />
            ))}
          </div>
        </div>
      }
    </aside>
  )
}

export default InfoSection