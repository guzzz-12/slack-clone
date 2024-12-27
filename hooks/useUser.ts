import { create } from "zustand";
import { User } from "@/types/supabase";

export type UserState = {
  user: User | null;
  loadingUser: boolean;
  setUser: (user: User | null) => void;
  setLoadingUser: (loading: boolean) => void;
};

/** State global del usuario autenticado */
export const useUser = create<UserState>((set) => ({
  user: null,
  loadingUser: true,
  setUser: (user) => set({ user: user, loadingUser: false }),
  setLoadingUser: (loading) => set({ loadingUser: loading }),
}));