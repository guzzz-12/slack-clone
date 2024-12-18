import { NextResponse } from "next/server";
import { getWsChannels } from "@/utils/getWsChannels";
import { uuidRegex } from "@/utils/constants";

interface Context {
  params: Promise<{workspaceId: string}>;
}

// Consultar los channels de un workspace mediante su ID
export async function GET(_req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    // Validar que la ID sea de tipo UUID
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }
    
    const channels = await getWsChannels(workspaceId);
    
    return NextResponse.json(channels);
    
  } catch (error) {
    console.log(`Error consultando channels`, error);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}