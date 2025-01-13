"use client"

import { useEffect, useState } from "react";
import axios from "axios";
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
import { User } from "@/types/supabase";

interface Props {
  chatId: string;
  user: User;
}

const VideoChat = ({chatId, user}: Props) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      setLoading(true);

      try {
        const res = await axios<{token: string}>({
          method: "GET",
          url: `/api/livekit/token`,
          params: {
            room: chatId,
            username: user.email
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

  if (loading) {
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