import { NextResponse } from "next/server";
import { PostgrestError } from "@supabase/supabase-js";
import { getWorkspace } from "@/utils/getWorkspace";
import { uuidRegex } from "@/utils/constants";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Consultar un workspace mediante su ID
export async function GET(_req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    // Validar que la ID sea de tipo UUID
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }
    
    const workspaceWithMembers = await getWorkspace(workspaceId);
  
    return NextResponse.json({
      workspaceData: workspaceWithMembers.workspaceData,
      workspaceMembers: workspaceWithMembers.workspaceMembers
    });
    
  } catch (error: any) {
    // Verificar si el error es de PostgreSQL
    const isPostgresError = (error: any): error is PostgrestError => {
      return "details" in error;
    }

    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando workspace: ${message}, code: ${code}`);

      // Verificar si el error es de workspace no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Workspace not found"}, {status: 404});
      }

    } else {
      console.log(error);
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}