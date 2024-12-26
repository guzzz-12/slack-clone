"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { FaSlackHash } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Workspace, WorkspaceWithMembers } from "@/types/supabase";
import { pageBaseTitle } from "@/utils/constants";

interface Props {
  params: {
    workspaceId: string;
  }
}

const WorkspaceDetailPage = ({params}: Props) => {
  const {workspaceId} = params;

  const router = useRouter();

  const {currentWorkspace, loadingWorkspaces, setLoadingWorkspaces, setCurrentWorkspace, setUserWorkspaces} = useWorkspace();

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


  // Actualizar el title de la página al cambiar de workspace
  useEffect(() => {
    if (currentWorkspace && !loadingWorkspaces) {
      document.title = `${pageBaseTitle} | ${currentWorkspace.workspaceData.name}`;
    } else {
      document.title = pageBaseTitle;
    }
  }, [currentWorkspace, loadingWorkspaces]);


  if (!currentWorkspace) {
    return null;
  }


  return (
    <main className="flex flex-col justify-center items-center flex-grow p-4 rounded-r-lg bg-neutral-900 overflow-y-auto scrollbar-thin">
      {loadingWorkspaces && <CgSpinner className="w-16 h-16 animate-spin" />}

      {!loadingWorkspaces && (
        <>
          <h1 className="mb-2 text-center text-3xl font-normal">
            Welcome to <span className="font-mono">#{(currentWorkspace.workspaceData.name).replace(" ", "")}</span>
          </h1>

          <section className="flex flex-col justify-center items-center gap-3 w-full">
            <h2 className="text-lg text-center text-neutral-300">
              Select a channel or a private conversation
            </h2>

            <FaSlackHash className="w-32 h-32 text-neutral-600"/>
          </section>
        </>
      )}
    </main>
  )
}

export default WorkspaceDetailPage