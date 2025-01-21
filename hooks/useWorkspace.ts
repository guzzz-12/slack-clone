import {create} from "zustand";
import { Workspace, WorkspaceWithMembers } from "@/types/supabase";

interface WorkspaceState {
  currentWorkspace: WorkspaceWithMembers | null;
  userWorkspaces: Workspace[];
  loadingWorkspaces: boolean;
  setCurrentWorkspace: (workspace: WorkspaceWithMembers | null) => void;
  setUserWorkspaces: (workspaces: Workspace[]) => void;
  setLoadingWorkspaces: (loading: boolean) => void;
}

// Hook para manejar el estado global del workspace
export const useWorkspace = create<WorkspaceState>()((set) => ({
  currentWorkspace: null,
  userWorkspaces: [],
  loadingWorkspaces: true,
  setCurrentWorkspace: (workspace) => set({currentWorkspace: workspace}),
  setUserWorkspaces: (workspaces) => set({userWorkspaces: workspaces}),
  setLoadingWorkspaces: (loading) => set({loadingWorkspaces: loading})
}));