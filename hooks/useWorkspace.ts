import {create} from "zustand";
import { Channel, Workspace, WorkspaceWithMembers } from "@/types/supabase";

interface WorkspaceState {
  currentWorkspace: WorkspaceWithMembers | null;
  currentChannel: Channel | null;
  userWorkspaces: Workspace[];
  workspaceChannels: Channel[];
  loadingWorkspaces: boolean;
  setCurrentWorkspace: (workspace: WorkspaceWithMembers | null) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setUserWorkspaces: (workspaces: Workspace[]) => void;
  setWorkspaceChannels: (channels: Channel[]) => void;
  setLoadingWorkspaces: (loading: boolean) => void;
}

// Hook para manejar el estado global del workspace
export const useWorkspace = create<WorkspaceState>()((set) => ({
  currentWorkspace: null,
  currentChannel: null,
  userWorkspaces: [],
  workspaceChannels: [],
  loadingWorkspaces: true,
  setCurrentWorkspace: (workspace) => set({currentWorkspace: workspace}),
  setCurrentChannel: (channel) => set({currentChannel: channel}),
  setUserWorkspaces: (workspaces) => set({userWorkspaces: workspaces}),
  setWorkspaceChannels: (channels) => set({workspaceChannels: channels}),
  setLoadingWorkspaces: (loading) => set({loadingWorkspaces: loading})
}));