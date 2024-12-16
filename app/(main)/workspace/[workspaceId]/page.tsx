"use client";

import { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Workspace, WorkspaceWithMembers } from "@/types/supabase";

interface Props {
  params: {
    workspaceId: string;
  }
}

const WorkspaceDetailPage = ({params}: Props) => {
  const {workspaceId} = params;

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
    <main className="flex-grow p-4 rounded-r-lg bg-neutral-900 overflow-y-auto scrollbar-thin">
      <section className="w-full rounded-r-lg">
        Workspace Detail Page
      </section>
    </main>
  )
}

export default WorkspaceDetailPage