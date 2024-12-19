"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Workspace, WorkspaceWithMembers } from "@/types/supabase";
import { FaSlackHash } from "react-icons/fa";

interface Props {
  params: {
    workspaceId: string;
  }
}

const WorkspaceDetailPage = ({params}: Props) => {
  const {workspaceId} = params;

  const router = useRouter();

  const {setLoadingWorkspaces, setCurrentWorkspace, setUserWorkspaces} = useWorkspace();

  // Consultar el workspace y sus miembros
  useEffect(() => {
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

    // Almacenar la ID del workspace seleccionado en el localStorage
    localStorage.setItem("selectedWorkspaceId", workspaceId);

    fetchWorkspace();
  }, [workspaceId]);

  return (
    <main className="flex justify-center items-center flex-grow p-4 rounded-r-lg bg-neutral-900 overflow-y-auto scrollbar-thin">
      <section className="flex flex-col justify-center items-center gap-3 w-full">
        <h1 className="text-4xl text-center">
          Select a channel <br /> or start a new conversation
        </h1>

        <FaSlackHash className="w-32 h-32 opacity-20"/>
      </section>
    </main>
  )
}

export default WorkspaceDetailPage