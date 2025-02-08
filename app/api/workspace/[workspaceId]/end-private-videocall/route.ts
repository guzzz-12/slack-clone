import { NextRequest, NextResponse } from "next/server";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { pusher } from "@/utils/pusher";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Route handler para finalizar una videollamada privada
export async function DELETE(req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    const searchParams = new URL(req.url).searchParams;
    const callerId = searchParams.get("caller_id");

    // Validar que la ID sea de tipo UUID
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    await pusher.trigger(`videocall-${callerId}-${workspaceId}`, "call-ended", {callerId});

    return NextResponse.json("Call ended successfully");
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL finalizando videollamada privada: ${message}, code: ${code}`);

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