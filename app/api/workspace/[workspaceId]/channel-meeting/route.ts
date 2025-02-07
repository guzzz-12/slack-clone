import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { isPostgresError, uuidRegex } from "@/utils/constants";
import { pusher } from "@/utils/pusher";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Route handler para actualizar los connectados en una videollamada de channel
export async function PATCH(req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const searchParams = new URL(req.url).searchParams;
    const channelId = searchParams.get("channel_id");
    const userId = searchParams.get("user_id");

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Validar la ID del channel
    if (!channelId || !uuidRegex.test(channelId)) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }

    // Validar la ID del user
    if (!userId || !uuidRegex.test(userId)) {
      return NextResponse.json({message: "User not found"}, {status: 404});
    }

    const supabase = supabaseServerClient();

    const {data: channelData, error: channelError} = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();
  
    if (channelError) {
      throw channelError;
    }

    const {meeting_members} = channelData;

    // Agregar el miembro a la video conferencia del channel
    const {data: updatedMeetingData, error: updatedMeetingError} = await supabase
    .from("channels")
    .update({
      meeting_members: [...meeting_members, userId]
    })
    .eq("id", channelId)
    .select("*")
    .single();

    if (updatedMeetingError) {
      throw updatedMeetingError;
    }

    // Emitir evento para actualizar los miembros de la videoconferencia en los demás usuarios
    pusher.trigger(`videocall-${channelId}-${workspaceId}`, "member-connected", {meetingChannel: updatedMeetingData});
    
    return NextResponse.json(updatedMeetingData);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL agregando miembro a la videoconferencia: ${message}, code: ${code}`);

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


export async function DELETE(req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;
    const searchParams = new URL(req.url).searchParams;
    const channelId = searchParams.get("channel_id");
    const userId = searchParams.get("user_id");

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Validar la ID del channel
    if (!channelId || !uuidRegex.test(channelId)) {
      return NextResponse.json({message: "Channel not found"}, {status: 404});
    }

    // Validar la ID del user
    if (!userId || !uuidRegex.test(userId)) {
      return NextResponse.json({message: "User not found"}, {status: 404});
    }

    const supabase = supabaseServerClient();

    const {data: channelData, error: channelError} = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();
  
    if (channelError) {
      throw channelError;
    }

    const {meeting_members} = channelData;
    const filteredMember = meeting_members.filter((memberId) => memberId !== userId);

    // Eliminar el miembro de la video conferencia del channel
    const {data: updatedMeetingData, error: updatedMeetingError} = await supabase
    .from("channels")
    .update({
      meeting_members: filteredMember
    })
    .eq("id", channelId)
    .select("*")
    .single();

    if (updatedMeetingError) {
      throw updatedMeetingError;
    }

    // Emitir evento para actualizar los miembros de la videoconferencia en los demás usuarios
    pusher.trigger(`videocall-${channelId}-${workspaceId}`, "member-disconnected", {meetingChannel: updatedMeetingData});
    
    return NextResponse.json(updatedMeetingData);
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL eliminando miembro de la videoconferencia: ${message}, code: ${code}`);

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