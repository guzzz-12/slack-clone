import { isPostgresError, uuidRegex } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{workspaceId: string}>
}

// Route handler para consultar los mensajes sin leer de los channels de un workspace
export async function GET(req: Request, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    const searchParams = new URL(req.url).searchParams;
    const messageType = searchParams.get("messageType") as "channel" | "private";

    if (!messageType || (messageType !== "channel" && messageType !== "private")) {
      return NextResponse.json({message: "Invalid message type"}, {status: 400});
    }

    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    }

    if (messageType === "channel") {
      // Consultar los mensajes sin leer de todos los channels del workspace
      const {data: messages, error} = await supabase
        .from("messages")
        .select("id, channel_id, workspace_id")
        .eq("workspace_id", workspaceId)
        .not("sender_id", "eq", user.id)
        .or(`seen_by.is.null, seen_by.not.cs.{${user.id}}`)
  
      // Verificar si hubo error de base de datos al consultar los mensajes sin leer
      if (error) {
        throw error;
      }
  
      return NextResponse.json(messages, {status: 200});
    }

    // Consultar los mensajes sin leer de la conversación privada
    const {data, error} = await supabase
    .from("private_messages")
    .select("*, sender:users!sender_id(id, name, email, avatar_url), recipient:users!recipient_id(id, name, email, avatar_url)")
    .eq("workspace_id", workspaceId)
    .eq("recipient_id", user.id)
    .is("seen_at", null);

    // Verificar si hubo error de base de datos al consultar los mensajes sin leer
    if (error) {
      throw error;
    }

    return NextResponse.json(data, {status: 200});
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando mensajes sin leer: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Workspace not found"}, {status: 404});
      }
    }

    console.log(`Error consultando mensajes sin leer`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}

// Route handler para marcar como leídos los mensajes sin leer
// de los channels o de la conversación privada de un workspace
export async function PATCH(req: NextRequest, {params}: Context) {
  try {
    const workspaceId = (await params).workspaceId;

    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get("messageId");
    const messageType = searchParams.get("messageType") as "channel" | "private";

    if (!messageType || (messageType !== "channel" && messageType !== "private")) {
      return NextResponse.json({message: "Invalid message type"}, {status: 400});
    }

    // Validar la ID del mensaje
    if (!messageId || !uuidRegex.test(messageId)) {
      return NextResponse.json({message: "Message not found"}, {status: 404});
    }

    // Validar la ID del workspace
    if (!uuidRegex.test(workspaceId)) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    }

    // Marcar como leidos los mensajes sin leer de un channel
    if (messageType === "channel") {
      const {data: message, error: messageError} = await supabase
        .from("messages")
        .select("seen_by")
        .eq("id", messageId)
  
      // Verificar si hubo error de base de datos al consultar el mensaje
      if (messageError) {
        throw messageError;
      }
  
      if (!message || message.length === 0) {
        return NextResponse.json({message: "Message not found"}, {status: 404});
      }
  
      // Marcar como leidos los mensajes sin leer de todos los channels del workspace
      const {data: updatedMessage, error} = await supabase
        .from("messages")
        .update({seen_by: message[0].seen_by ? [...message[0].seen_by, user.id] : [user.id]})
        .eq("id", messageId)
        .select("*, sender:users(id, name, email, avatar_url)")
        .single();
  
      // Verificar si hubo error de base de datos al marcar como leidos los mensajes sin leer
      if (error) {
        throw error;
      }
  
      return NextResponse.json(updatedMessage, {status: 200});
    }

    // Consultar el mensaje de la conversación privada
    const {data: message, error: messageError} = await supabase
    .from("private_messages")
    .select("*")
    .eq("id", messageId)
    .eq("recipient_id", user.id);

    // Verificar si hubo error de base de datos al consultar el mensaje
    if (messageError) {
      throw messageError;
    }

    if (!message || message.length === 0) {
      return NextResponse.json({message: "Message not found"}, {status: 404});
    }

    // Marcar como leido el mensaje de la conversación privada
    const {data, error} = await supabase
    .from("private_messages")
    .update({seen_at: (new Date()).toISOString()})
    .eq("id", messageId)
    .select("*, sender:users!sender_id(id, name, email, avatar_url), recipient:users!recipient_id(id, name, email, avatar_url)");

    // Verificar si hubo error de base de datos al marcar como leidos los mensajes sin leer
    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({message: "Message not found"}, {status: 404});
    }

    return NextResponse.json(data[0], {status: 200});
    
  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL consultando mensajes sin leer: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Workspace not found"}, {status: 404});
      }
    }

    console.log(`Error marcar mensajes sin leer`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}