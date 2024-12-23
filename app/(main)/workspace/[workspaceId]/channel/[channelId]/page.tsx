"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Channel, Workspace, WorkspaceWithMembers } from "@/types/supabase";

interface Props {
  params: {
    workspaceId: string;
    channelId: string;
  }
}

const ChannelPage = ({params}: Props) => {
  const {workspaceId, channelId} = params;
  
  const router = useRouter();

  const [channelData, setChannelData] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    currentWorkspace,
    setLoadingWorkspaces,
    setCurrentWorkspace,
    setUserWorkspaces
  } = useWorkspace();

  /** Consultar el workspace y sus miembros */
  const fetchWorkspace = async () => {
    try {
      setLoadingWorkspaces(true);

      const currentWorkspace = await axios<WorkspaceWithMembers>(`/api/workspace/${workspaceId}`);
      const userWorkspaces = await axios<Workspace[]>("/api/workspace/user-workspaces");

      setCurrentWorkspace({
        workspaceData: currentWorkspace.data.workspaceData,
        workspaceMembers: currentWorkspace.data.workspaceMembers
      });

      setUserWorkspaces(userWorkspaces.data);

    } catch (error: any) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        toast.error("Workspace not found", {duration: 5000});
        return router.replace("/user-workspaces");
      }

      toast.error(error.message);

    } finally {
      setLoadingWorkspaces(false);
    }
  }

  /** Consultar el channel y sus mensajes asociados */
  const getChannel = async () => {
    try {
      setLoading(true);

      const {data} = await axios.get<Channel>(`/api/workspace/${workspaceId}/channels/${channelId}`);

      setChannelData(data);

    } catch (error: any) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        if (error.response.data.message.toLowerCase().includes("channel")) {
          toast.error("Channel not found", {duration: 5000});
          return router.replace(`/workspace/${workspaceId}`);
        };

        toast.error("Workspace not found");
        return router.replace("/user-workspaces");
      }

      toast.error(error.message);
      
    } finally {
      setLoading(false);
    }
  }

  // Consultar el channel con sus mensajes el workspace con sus miembros
  useEffect(() => {
    // Consultar el workspace si no se ha hecho ya
    // Esto es en caso de que se recargue la página
    // del channel y el state del workspace esté vacío
    if (!currentWorkspace) {
      fetchWorkspace();
    }

    // Consultar el channel si ya cargó el workspace
    if (currentWorkspace) {
      getChannel();
    }
  }, [workspaceId, channelId, currentWorkspace]);


  return (
    <main className="flex flex-col flex-grow rounded-r-lg bg-neutral-900 overflow-hidden">
      <ChatHeader
        title={`#${channelData?.name}`}
        loading={loading}
      />

      <section className="w-full flex-grow p-4 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col justify-start gap-3 w-full">
          <p className="text-xl">Chat content</p>
        </div>
      </section>

      <section className="w-full flex-shrink-0 bg-neutral-800 overflow-hidden">
        <ChatInput
          workspaceId={workspaceId}
          channelId={channelId}
          isLoading={loading}
        />
      </section>
    </main>
  )
}

export default ChannelPage