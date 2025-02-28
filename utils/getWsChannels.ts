import { Channel } from "@/types/supabase";
import { supabaseServerClient } from "./supabase/supabaseServerClient";

// Consultar los channels de un workspace
export const getWsChannels = async (workspaceId: string): Promise<Channel[]> => {
  const supabase = supabaseServerClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("last_message_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};