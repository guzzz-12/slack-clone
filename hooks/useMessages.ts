import { create } from "zustand";
import { MessageWithSender } from "@/types/supabase";

interface MessagesState {
  messages: MessageWithSender[];
  loadingMessages: boolean;
  hasMore: boolean;
  page: number;
  term: string;
  setMessages: (messages: MessageWithSender[]) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  setTerm: (term: string) => void;
}

export const useMessages = create<MessagesState>((set) => ({
  messages: [],
  loadingMessages: true,
  hasMore: true,
  page: 1,
  term: "",
  setMessages: (messages) => set({ messages }),
  setLoadingMessages: (loading) => set({ loadingMessages: loading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
  setTerm: (term) => set({ term }),
}));