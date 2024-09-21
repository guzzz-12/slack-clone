import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

/** Agregar un miembro a un workspace */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspace_id = searchParams.get("workspace_id");
    const member_id = searchParams.get("member_id");

    if (!member_id) {
      return NextResponse.json({message: "Invalid member ID"}, {status: 400});
    }

    if (!workspace_id) {
      return NextResponse.json({message: "Invalid workspace ID"}, {status: 400});
    }

    const supabase = supabaseServerClient();

    await supabase
    .from("members_workspaces")
    .insert({
      user_id: member_id,
      workspace_id
    });

    return NextResponse.json("Member added successfully");
    
  } catch (error: any) {
    console.log(`Error agregando miembro al workspace`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}