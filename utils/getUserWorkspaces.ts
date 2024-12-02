import { supabaseServerClient } from "./supabase/supabaseServerClient";
import { getUserData } from "./getUserData";
import { Workspace } from "@/types/supabase";

// Consultar todos los workspaces a los que pertenece el usuario autenticado
export const getUserWorkspaces = async (): Promise<Workspace[]> => {
  const supabase = supabaseServerClient();

  // Consultar la data del usuario en la base de datos
  const userData = await getUserData();

  // Consultar los workspaces del usuario a través de la tabla pivote
  const {data, error} = await supabase
    .from("members_workspaces")
    .select("workspaces(*)")
    .eq("user_id", userData.id);

  if (error) {    
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  // Reestructurar la data a un array de objetos filtrando los nulls
  const workspaces = data.map(workspace => workspace.workspaces!);

  return workspaces;
}