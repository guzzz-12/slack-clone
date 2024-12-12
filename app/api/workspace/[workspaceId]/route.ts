import { NextResponse } from "next/server";
import { getWorkspace } from "@/utils/getWorkspace";
import { getUserWorkspaces } from "@/utils/getUserWorkspaces";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Consultar un workspace mediante su ID
export async function GET(req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    
    const workspaceWithMembers = await getWorkspace(workspaceId);
  
    return NextResponse.json({
      workspaceData: workspaceWithMembers.workspaceData,
      workspaceMembers: workspaceWithMembers.workspaceMembers
    });
    
  } catch (error) {
    console.log(`Error consultando workspace`, error);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}