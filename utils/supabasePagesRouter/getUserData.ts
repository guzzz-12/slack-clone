import { NextApiRequest, NextApiResponse } from "next";
import { supabaseServerClientPages } from "./supabaseServerClientPages";
import { redirect } from "next/navigation";

// Consultar la data del usuario autenticado con pages-router
export const getUserData = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = supabaseServerClientPages(req, res);

  const {data, error} = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    return redirect("/login");
  }

  const {data: userData, error: userDataError} = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();
  
  if (userDataError) {
    throw userDataError;
  }

  if (!userData) {
    await supabase.auth.signOut();
    return redirect("/login");
  }

  return userData;
}