import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { pusher } from "@/utils/pusher";

interface Context {
  params: Promise<{workspaceId: string, channelId: string}>
}

// Route handler para consultar un channel asociado a un workspace
export async function GET(_req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const channelId = (await params).channelId;

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }
    
    // Validar la ID del channel
    if (!uuidRegex.test(channelId)) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }
    
    const supabase = supabaseServerClient();

    // Consultar el channel en la base de datos
    const {data: channel, error} = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .eq("workspace_id", workspaceId)
      .limit(1)
      .single();

    // Verificar si hubo error de base de datos al consultar el channel
    if (error) {
      throw error;
    }

    if (!channel) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }

    return NextResponse.json(channel);

  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando channel: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Channel not found"}, {status: 404});
      }
    }

    console.log(`Error consultando channel`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}

// Route handler para eliminar un channel asociado a un workspace
export async function DELETE(_req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const channelId = (await params).channelId;

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }
    
    // Validar la ID del channel
    if (!uuidRegex.test(channelId)) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }
    
    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    }

    // Consultar el channel
    const {data: channelData, error: channelError} = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();
    
    if (channelError) {
      throw channelError;
    }

    // Verificar si el channel que se quiere eliminar es el channel General
    if (channelData.name.toLowerCase() === "general") {
      return NextResponse.json({message: "Channel General cannot be deleted"}, {status: 403});
    }

    // Eliminar el channel
    const {data, error} = await supabase
      .from("channels")
      .delete()
      .eq("id", channelId)
      .eq("ws_admin_id", user.id)
      .select("*")
      .order("created_at", {ascending: false})
      .limit(1);
    
    // Verificar si hubo error de base de datos al eliminar el channel
    if (error) {
      throw error;
    }

    if (!data || !data[0]) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }

    // Emitir evento de channel eliminado
    await pusher.trigger(`workspace-${workspaceId}`, "channel-deleted", data[0]);

    return NextResponse.json(data[0]);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL eliminando el channel: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Channel or workspace not found"}, {status: 404});
      }
    }

    console.log(`Error eliminando el channel`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}