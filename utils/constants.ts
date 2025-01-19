import { MessageWithSender, PrivateMessageWithSender } from "@/types/supabase";
import { PostgrestError } from "@supabase/supabase-js";

// Expresion regular para validar strings de tipo UUID
export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Titulo base de las paginas
export const pageBaseTitle = "Slack Clone";

// Verificar si el error es de PostgreSQL
export const isPostgresError = (error: any): error is PostgrestError => {
  return "details" in error;
}

export const isChannelMessage = (message: any): message is MessageWithSender => {
  return "channel_id" in message;
}

export const isPrivateMessage = (message: any): message is PrivateMessageWithSender => {
  return !isChannelMessage(message);
}

/**
 * Combinar dos UUIDs de forma que siempre tengan el mismo orden
 */
export const combineUuid = (A: string, B: any) => {
  const aFirstSegment = A.split("-")[0];
  const bFirstSegment = B.split("-")[0];

  return [aFirstSegment, bFirstSegment].sort().join("-");
}