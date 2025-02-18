import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useWorkspace } from "./useWorkspace";
import { User, Workspace, WorkspaceWithMembers } from "@/types/supabase";

/** Custom hook para consultar un workspace y sus miembros */
const useFetchWorkspace = (workspaceId: string, currentUser: User | null) => {
  const router = useRouter();

  const {setLoadingWorkspaces, setCurrentWorkspace, setUserWorkspaces} = useWorkspace();

  /** Consultar el workspace y sus miembros */
  const fetchWorkspace = async () => {
    if (!currentUser) return;

    try {
      setLoadingWorkspaces(true);

      const currentWorkspace = await axios<WorkspaceWithMembers>(`/api/workspace/${workspaceId}`);
      const userWorkspaces = await axios<Workspace[]>("/api/workspace/user-workspaces");
      
      // Filtrar el usuario actual de la lista de miembros del workspace
      const filteredMembers = currentWorkspace.data.workspaceMembers.filter((member) => member.id !== currentUser.id);      

      setCurrentWorkspace({
        workspaceData: currentWorkspace.data.workspaceData,
        workspaceMembers: filteredMembers
      });

      setUserWorkspaces(userWorkspaces.data);

    } catch (error: any) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        toast.error("Workspace not found", {duration: 5000});
        return router.replace("/user-workspaces");
      }

      toast.error(error.message, {ariaProps: {role: "alert", "aria-live": "assertive"}});

    } finally {
      setLoadingWorkspaces(false);
    }
  }


  return {fetchWorkspace}
}

export default useFetchWorkspace