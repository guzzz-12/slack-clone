import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useWorkspace } from "./useWorkspace";
import { Workspace, WorkspaceWithMembers } from "@/types/supabase";

/** Custom hook para consultar un workspace y sus miembros */
const useFetchWorkspace = (workspaceId: string) => {
  const router = useRouter();

  const {setLoadingWorkspaces, setCurrentWorkspace, setUserWorkspaces} = useWorkspace();

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


  return {fetchWorkspace}
}

export default useFetchWorkspace