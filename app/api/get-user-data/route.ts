import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { uuidRegex } from "@/utils/constants";

// Route handler para consultar la data de un usuario mediante la ID
export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;

    const workspaceId = searchParams.get("workspaceId");
    const otherUserId = searchParams.get("otherUserId");

    // Validar la ID del workspace
    if (!workspaceId || !uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Validar la ID del usuario
    if (!otherUserId || !uuidRegex.test(otherUserId)) {
      return NextResponse.json({message: "User not found"}, {status: 404});
    }

    const supabase = supabaseServerClient();

    const {data: {user: userData}, error: userError} = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!userData) {
      return redirect("/signin");
    }

    const {data: memberData, error: memberError} = await supabase
    .from("members_workspaces")
    .select("member:users(id, name, email, avatar_url, is_away)")
    .eq("user_id", otherUserId)
    .eq("workspace_id", workspaceId)
    .limit(1)
    .single();

    if (memberError) {
      throw memberError;
    }

    return NextResponse.json(memberData.member);
    
  } catch (error: any) {
    console.log(`Error consultando los datos del usuario`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}