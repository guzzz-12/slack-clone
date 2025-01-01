import { MessageWithSender } from "./supabase";

export type PaginatedMessages = {
  messages: MessageWithSender[];
  hasMore: boolean;
};