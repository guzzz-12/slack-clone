import { create } from "zustand";
import { Message } from "@/types/supabase";

interface MessagesState<T> {
  messages: T[];
  loadingMessages: boolean;
  hasMore: boolean;
  page: number;
  term: string;
  isVideoCall: boolean;
  setMessages: (messages: T[]) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  setTerm: (term: string) => void;
  setIsVideoCall: (isVideoCall: boolean) => void;
}

export const useMessages = create<MessagesState<Message>>((set) => ({
  messages: [],
  loadingMessages: true,
  hasMore: true,
  page: 1,
  term: "",
  isVideoCall: false,
  setMessages: (messages) => set({ messages }),
  setLoadingMessages: (loading) => set({ loadingMessages: loading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
  setTerm: (term) => set({ term }),
  setIsVideoCall: (isVideoCall) => set({isVideoCall}),
}));