import {create} from "zustand";
import { Workspace, WorkspaceMember, WorkspaceWithMembers } from "@/types/supabase";

interface WorkspaceState {
  currentWorkspace: WorkspaceWithMembers | null;
  currentWorkspaceMembers: WorkspaceMember[];
  userWorkspaces: Workspace[];
  loadingWorkspaces: boolean;
  setCurrentWorkspace: (workspace: WorkspaceWithMembers | null) => void;
  setCurrentWorkspaceMembers: (members: WorkspaceMember[]) => void;
  setUserWorkspaces: (workspaces: Workspace[]) => void;
  setLoadingWorkspaces: (loading: boolean) => void;
}

// Hook para manejar el estado global del workspace
export const useWorkspace = create<WorkspaceState>()((set) => ({
  currentWorkspace: null,
  currentWorkspaceMembers: [],
  userWorkspaces: [],
  loadingWorkspaces: true,
  setCurrentWorkspace: (workspace) => set({currentWorkspace: workspace}),
  setCurrentWorkspaceMembers: (members) => set({currentWorkspaceMembers: members}),
  setUserWorkspaces: (workspaces) => set({userWorkspaces: workspaces}),
  setLoadingWorkspaces: (loading) => set({loadingWorkspaces: loading})
}));