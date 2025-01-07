import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "./supabase/supabaseServerClient";
import { WorkspaceWithMembers } from "@/types/supabase";
import { uuidRegex } from "./constants";

/** Consultar un workspace del usuario autenticado especificando la id del workspace */
export const getWorkspace = async (workspaceId: string): Promise<WorkspaceWithMembers> => {
  const supabase = supabaseServerClient();

  // Validar la ID del workspace
  if (!uuidRegex.test(workspaceId)) {
    console.log(`UUID inválida`);
    return notFound();
  }

  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }

  // Consultar el workspace
  const {data: workspaceData, error: workspaceError} = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .limit(1)
    .single();

  // Verificar si hubo error al consultar el workspace
  if (workspaceError) {
    throw workspaceError;
  }
  
  // Consultar los miembros del workspace
  const {data: membersData, error: membersError} = await supabase
    .from("workspaces")
    .select("members:members_workspaces(member:users(id, email, name, is_away, avatar_url))")
    .eq("id", workspaceId);

  // Verificar si hubo error al consultar los miembros
  if (membersError) {
    throw membersError;
  }

  // Verificar si el workspace o los miembros no fueron encontrados
  if (!workspaceData || !membersData) {
    return notFound();
  }

  const data = {
    workspaceData: workspaceData,
    workspaceMembers: membersData[0]?.members.map(item => item.member!),
  } satisfies WorkspaceWithMembers;

  return data;
}