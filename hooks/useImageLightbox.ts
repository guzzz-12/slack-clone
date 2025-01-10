import { create } from "zustand";
import { MessageWithSender } from "@/types/supabase";

interface ImageLightboxState {
  open: boolean;
  message: MessageWithSender | null;
  setOpen: (open: boolean) => void;
  setMessage: (message: MessageWithSender | null) => void;
}

/** State global del lightbox de las imágenes de los mensajes */
export const useImageLightbox = create<ImageLightboxState>((set) => ({
  open: false,
  message: null,
  setOpen: (open: boolean) => set({ open }),
  setMessage: (message: MessageWithSender | null) => set({ message })
}));