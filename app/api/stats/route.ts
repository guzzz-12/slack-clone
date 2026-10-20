import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/**
 * Creates a stateless Supabase client suitable for public API routes.
 * Prefers SUPABASE_SERVICE_ROLE_KEY if available (to bypass RLS),
 * otherwise falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Get existing users count
    const { data: rpcUserCount, error: rpcError } = await supabase.rpc(
      "count_registered_users"
    );

    if (rpcError) {
      throw rpcError;
    }

    // Get existing workspaces along with their associated channels count
    const {
      data: workspaceAndChannels,
      error: workspaceAndChannelsError
    } = await supabase.rpc("get_workspace_channel_counts");

    if (workspaceAndChannelsError) {
      throw workspaceAndChannelsError;
    }

    return NextResponse.json(
      {
        totalUsers: rpcUserCount,
        totalWorkspacesAndChannels: workspaceAndChannels,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in public stats API handler:", error?.message || error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

