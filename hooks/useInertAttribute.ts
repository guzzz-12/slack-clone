import { create } from "zustand";

export type InertState = {
  inert: boolean;
  setInert: (inert: boolean) => void
};

/** State global del usuario autenticado */
export const useInertAttribute = create<InertState>((set) => ({
  inert: false,
  setInert: (inert) => set({ inert }),
}));