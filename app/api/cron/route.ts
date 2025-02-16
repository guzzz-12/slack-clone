import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";

export const dynamic = "force-dynamic";

// Endpoint del cron job de vercel para evitar que el proyecto de supabase se deshabilite por inactividad
export async function GET(_req: NextRequest) {
  try {
    const headerList = headers();

    if (headerList.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({message: "Unauthorized cron request"}, {status: 401});
    }

    const supabase = supabaseServerClient();

    // Consultar el número de usuarios registrados en la app
    const { data, error } = await supabase.rpc("count_registered_users", {});

    if (error) {
      throw error;
    }

    return NextResponse.json({CRON_JOB_DATA: {activeUsers: data}});
    
  } catch (error: any) {
    console.log(`Error consultando endpoint del cron job de vercel:`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}