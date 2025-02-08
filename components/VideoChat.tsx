"use client"

import { useEffect, useState } from "react";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Track } from "livekit-client";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";

import Spinner from "./Spinner";
import { Channel, User } from "@/types/supabase";
import { useMessages } from "@/hooks/useMessages";
import { useWorkspace } from "@/hooks/useWorkspace";
import { combineUuid } from "@/utils/constants";

interface Props {
  workspaceId: string;
  chatId: string;
  user: User;
  callType: "channel" | "private";
}

const VideoChat = ({workspaceId, chatId, user, callType}: Props) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  const {setCallerId, setVideoCallType} = useMessages();
  const {workspaceChannels, setWorkspaceChannels} = useWorkspace();

  // Generar el token de LiveKit
  useEffect(() => {
    const getToken = async () => {
      setLoading(true);

      const combinedUsersIds = combineUuid(user.id, chatId);

      try {
        const res = await axios<{token: string}>({
          method: "GET",
          url: `/api/livekit/token`,
          params: {
            room: callType === "private" ? combinedUsersIds : chatId,
            username: user.email,
            caller_id: callType === "private" ? combinedUsersIds : chatId,
            call_type: callType,
            workspace_id: workspaceId
          }
        });

        const token = res.data.token;
        setToken(token);
        
      } catch (error: any) {
        toast.error(error.message);

      } finally {
        setLoading(false);
      }
    }

    getToken();
  }, [chatId, user]);

  const onConnectedHandler = async () => {
    if (callType === "channel") {
      try {
        const res = await axios<Channel>({
          method: "PATCH",
          url: `/api/workspace/${workspaceId}/channel-meeting`,
          params: {
            channel_id: chatId,
            user_id: user.id
          }
        });

        // Actualizar el state del channel de la conferencia
        const channelIndex = workspaceChannels.findIndex((ch) => ch.id === res.data.id);

        if (channelIndex !== -1) {
          const updatedChannels = [...workspaceChannels];
          updatedChannels.splice(channelIndex, 1, res.data);
          setWorkspaceChannels(updatedChannels);
        }

      } catch (error: any) {
        let message = error.message;

        if (isAxiosError(error)) {
          message = error.response?.data.message;
        }

        toast.error(message);
      }
    }
  }

  const onDisconnectHandler = async () => {
    try {
      if (callType === "private") {
        const combinedUsersIds = combineUuid(user.id, chatId);
        
        await axios({
          method: "DELETE",
          url: `/api/workspace/${workspaceId}/end-private-videocall`,
          params: {
            caller_id: combinedUsersIds
          }
        });
      }

      if (callType === "channel") {
        const res = await axios<Channel>({
          method: "DELETE",
          url: `/api/workspace/${workspaceId}/channel-meeting`,
          params: {
            channel_id: chatId,
            user_id: user.id
          }
        });

        // Actualizar el state del channel de la conferencia
        const channelIndex = workspaceChannels.findIndex((ch) => ch.id === res.data.id);

        if (channelIndex !== -1) {
          const updatedChannels = [...workspaceChannels];
          updatedChannels.splice(channelIndex, 1, res.data);
          setWorkspaceChannels(updatedChannels);
        }
      }

      setToken("");
      setCallerId(null);
      setVideoCallType(null);
      
    } catch (error: any) {
      let message = error.message;

      if (isAxiosError(error)) {
        message = error.response?.data.message;
      }

      toast.error(message);
    }
  }

  if (loading || !user) {
    return <Spinner />
  }

  return (
    <LiveKitRoom
      style={{ height: "100dvh" }}
      video={true}
      audio={true}
      connect={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      onConnected={onConnectedHandler}
      onDisconnected={onDisconnectHandler}
    >
      <MyVideoConference />
      <RoomAudioRenderer />
      <ControlBar />
    </LiveKitRoom>
  )
}

function MyVideoConference() {
  // `useTracks` retorna todos los tracks de cámara y pantalla compartidas. Si un usuario se une sin publicar un track de cámara, se retorna un placeholder.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      {/*
        El GridLayout acepta ninguno o un child. El child se utiliza
        como template para renderizar todos los tracks
      */}
      <ParticipantTile />
    </GridLayout>
  );
}

export default VideoChat