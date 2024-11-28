import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "./supabase/supabaseServerClient";
import { Workspace } from "@/types/supabase";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Consultar un workspace del usuario autenticado especificando la id del workspace */
export const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
  const supabase = supabaseServerClient();

  // Validar la ID del workspace
  if (!uuidRegex.test(workspaceId)) {
    console.log(`UUID inválida`);
    return notFound();
  }

  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const {data, error} = await supabase
    .from("members_workspaces")
    .select("workspaces(*)")
    .eq("user_id", user.id)
    .eq("workspace_id", workspaceId)
    .limit(1);

  if (error) {
    throw new Error(error.message)
  }

  if (!data[0]) {
    return notFound();
  }

  return data[0].workspaces;
}