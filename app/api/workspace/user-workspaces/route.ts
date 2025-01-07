import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

// Consultar todos los workspaces del usuario
export async function GET(_req: NextRequest) {
  try {
    const supabase = supabaseServerClient();
    
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    }

    // Consultar los workspaces del usuario
    const {data: workspaces, error} = await supabase
      .from("members_workspaces")
      .select("workspaces(id, name, image_url, slug)")
      .eq("user_id", user.id);
    
    if (error) {
      throw new Error(error.message);
    }

    const filteredNulls = workspaces.map(w => w.workspaces!);

    return NextResponse.json(filteredNulls);
    
  } catch (error: any) {
    console.log(`Error consultando workspaces del usuario`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}