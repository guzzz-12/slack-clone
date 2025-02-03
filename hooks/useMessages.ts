import { create } from "zustand";
import { Message } from "@/types/supabase";

interface MessagesState<T> {
  messages: T[];
  loadingMessages: boolean;
  hasMore: boolean;
  page: number;
  term: string;
  /** `callerId` puede ser la `ID` del channel actual o las `IDs` combinadas de los usuarios de la conversación privada */
  callerId: string | null;
  videoCallType: "channel" | "private" | null;
  setMessages: (messages: T[]) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  setTerm: (term: string) => void;
  setCallerId: (callerId: string | null) => void;
  setVideoCallType: (videoCallType: "channel" | "private" | null) => void;
}

export const useMessages = create<MessagesState<Message>>((set) => ({
  messages: [],
  loadingMessages: true,
  hasMore: true,
  page: 1,
  term: "",
  callerId: null,
  videoCallType: null,
  setMessages: (messages) => set({ messages }),
  setLoadingMessages: (loading) => set({ loadingMessages: loading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
  setTerm: (term) => set({ term }),
  setCallerId: (callerId) => set({callerId}),
  setVideoCallType: (videoCallType) => set({videoCallType}),
}));