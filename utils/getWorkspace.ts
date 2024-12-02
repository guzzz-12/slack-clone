import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "./supabase/supabaseServerClient";
import { WorkspaceWithMembers } from "@/types/supabase";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    return redirect("/login");
  }

  // Consultar el workspace
  const {data: workspaceData, error: workspaceError} = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .limit(1)
    .single();
  
  // Consultar los miembros del workspace
  const {data: membersData, error: membersError} = await supabase
    .from("workspaces")
    .select("members:members_workspaces(member:users(id, email, name, is_away, avatar_url))")
    .eq("id", workspaceId);

  // Verificar si hubo errores al consultar el workspace o los miembros
  if (workspaceError || membersError) {
    throw new Error(workspaceError?.message || membersError?.message)
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