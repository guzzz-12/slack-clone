import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { pusher } from "@/utils/pusher";

// Route handler para generar el token de LiveKit
export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const room = searchParams.get("room");
    const username = searchParams.get("username");
    const workspaceId = searchParams.get("workspace_id");
    const callerId = searchParams.get("caller_id");
    const callType = searchParams.get("call_type") as "channel" | "private";
  
    if (!room) {
      return NextResponse.json({ error: "Missing 'room' query parameter" }, { status: 400 });
    } else if (!username) {
      return NextResponse.json({ error: "Missing 'username' query parameter" }, { status: 400 });
    }
  
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  
    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
  
    const at = new AccessToken(apiKey, apiSecret, { identity: username });
  
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    if (callType === "private") {
      pusher.trigger(`videocall-${callerId}-${workspaceId}`, "incoming-call", {callerId});
    }
  
    return NextResponse.json({ token: await at.toJwt() });
    
  } catch (error: any) {
    console.log(error.message);

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}