import { create } from "zustand";
import { Message } from "@/types/supabase";

interface ImageLightboxState {
  open: boolean;
  message: Message | null;
  setOpen: (open: boolean) => void;
  setMessage: (message: Message | null) => void;
}

/** State global del lightbox de las imágenes de los mensajes */
export const useImageLightbox = create<ImageLightboxState>((set) => ({
  open: false,
  message: null,
  setOpen: (open: boolean) => set({ open }),
  setMessage: (message: Message | null) => set({ message })
}));