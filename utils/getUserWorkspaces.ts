import { supabaseServerClient } from "./supabase/supabaseServerClient";
import { getUserData } from "./getUserData";

type UserWorkspacesWithMembers = {
  workspace_id: string;
  workspace_name: string;
  workspace_image: string;
  members: {
    username: string;
    email: string;
    avatar_url: string;
  }[];
}[];

// Consultar todos los workspaces a los que pertenece el usuario autenticado
export const getUserWorkspaces = async (): Promise<UserWorkspacesWithMembers> => {
  const supabase = supabaseServerClient();

  // Consultar la data del usuario en la base de datos
  const userData = await getUserData();

  // Consultar los workspaces del usuario con sus miembros
  const {data, error} = await supabase.rpc("get_workspaces_with_members", {
    user_id: userData.id
  });

  if (error) {    
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data as UserWorkspacesWithMembers;
}