"use client";

import { useEffect } from "react";
import { FaSlackHash } from "react-icons/fa";
import { LuLoader2 } from "react-icons/lu";
import { useWorkspace } from "@/hooks/useWorkspace";
import useFetchWorkspace from "@/hooks/useFetchWorkspace";
import { useUser } from "@/hooks/useUser";
import { pageBaseTitle } from "@/utils/constants";

interface Props {
  params: {
    workspaceId: string;
  }
}

const WorkspaceDetailPage = ({params}: Props) => {
  const {workspaceId} = params;

  const {user} = useUser();
  
  const {fetchWorkspace} = useFetchWorkspace(workspaceId, user);

  const {currentWorkspace, loadingWorkspaces} = useWorkspace();

  useEffect(() => {
    // Almacenar la ID del workspace seleccionado en el localStorage
    localStorage.setItem("selectedWorkspaceId", workspaceId);
    
    // Consultar el workspace y sus miembros
    if (user) {
      fetchWorkspace();
    }
  }, [workspaceId, user]);


  // Actualizar el title de la página al cambiar de workspace
  useEffect(() => {
    if (currentWorkspace && !loadingWorkspaces) {
      document.title = `${pageBaseTitle} | ${currentWorkspace.workspaceData.name}`;
    } else {
      document.title = pageBaseTitle;
    }
  }, [currentWorkspace, loadingWorkspaces]);


  return (
    <main className="flex flex-col justify-center items-center flex-grow p-4 rounded-r-lg bg-neutral-900 overflow-y-auto scrollbar-thin">
      {loadingWorkspaces && <LuLoader2 className="animate-spin" size={35} />}

      {!loadingWorkspaces && currentWorkspace && (
        <>
          <h1 className="mb-2 text-center text-xl min-[800px]:text-3xl font-normal">
            Welcome to <span className="font-mono">#{(currentWorkspace.workspaceData.name).replace(" ", "")}</span>
          </h1>

          <section className="flex flex-col justify-center items-center gap-3 w-full">
            <h2 className="text-sm min-[800px]:text-lg text-center text-neutral-300">
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