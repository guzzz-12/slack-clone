import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Endpoint del cron job de vercel creado como solución temporal
// para evitar que el servidor de snapgram se deshabilite por inactividad
export async function GET(_req: NextRequest) {
  try {
    const headerList = headers();
    
    if (headerList.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: "Consulta no autorizada al endpoint keep-alive de snapgram" }, { status: 401 });
    }

    // Consultar al endpoint keep-alive del servidor de snapgram
    const response = await fetch("https://snapgram-backend-1fv0.onrender.com/api/keep-alive");

    if (!response.ok) {
      return NextResponse.json({message: "Error consultando endpoint keep-alive de snapgram"}, {status: response.status});
    }

    return NextResponse.json({message: "Consulta exitosa al endpoint keep-alive de snapgram"});
    
  } catch (error: any) {
    console.log(`Error consultando endpoint keep-alive de snapgram`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}