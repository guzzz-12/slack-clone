"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { FaSlackHash } from "react-icons/fa";
import { PiHandWavingFill } from "react-icons/pi";
import { CgSpinner } from "react-icons/cg";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Workspace, WorkspaceWithMembers } from "@/types/supabase";

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


  if (!currentWorkspace) {
    return null;
  }


  return (
    <main className="flex flex-col justify-center items-center flex-grow p-4 rounded-r-lg bg-neutral-900 overflow-y-auto scrollbar-thin">
      {loadingWorkspaces && <CgSpinner className="w-16 h-16 animate-spin" />}

      {!loadingWorkspaces && (
        <>
          <div className="flex justify-center items-center gap-1 w-full mb-3">
            <PiHandWavingFill className="w-10 h-10" /> 

            <h1 className="text-4xl text-center font-normal">
              Welcome to <span className="font-mono">#{(currentWorkspace.workspaceData.name).replace(" ", "")}</span>
            </h1>
          </div>

          <section className="flex flex-col justify-center items-center gap-3 w-full">
            <h2 className="text-xl text-center">
              Select a channel or private conversation
            </h2>

            <FaSlackHash className="w-32 h-32 opacity-20"/>
          </section>
        </>
      )}
    </main>
  )
}

export default WorkspaceDetailPage