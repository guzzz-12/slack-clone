import { redirect } from "next/navigation";
import { supabaseServerClient } from "./supabase/supabaseServerClient";
import { Workspace } from "@/types/supabase";


/** Consultar la data del usuario autenticado */
export const getUserData = async () => {
  const supabase = supabaseServerClient();

  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }

  const {data, error} = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return redirect("/signin");
  }

  return data;
}


/** Consultar todos los workspaces del usuario autenticado o el último al que se unió */
export const getAllUserWorkspaces = async (latest: boolean = false) => {
  const supabase = supabaseServerClient();

  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }

  const query = supabase
    .from("members_workspaces")
    .select("workspaces(*)")
    .eq("user_id", user.id)
    .order("created_at", {ascending: false});

  // Retornar un solo workspace si se solicita sólo el mas reciente
  if (latest) {
    query.limit(1);
  }

  const {data, error} = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  // Convertir la data de los workspaces en un array de objetos workspace
  const reduced = data.reduce((acc: Workspace[], curr) => {
    if (curr.workspaces) {
      return acc.concat(curr.workspaces)
    }

    return acc;
  }, []);
  
  return reduced;
}