import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import sendgrid from "@sendgrid/mail";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { cronJobEmailTemplate } from "@/utils/cronJobEmailTemplate";

export const dynamic = "force-dynamic";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

// Endpoint del cron job de vercel para evitar que el proyecto de supabase se deshabilite por inactividad
export async function GET(_req: NextRequest) {
  try {
    const headerList = headers();

    if (headerList.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: "Unauthorized cron request" }, { status: 401 });
    }

    const supabase = supabaseServerClient();

    // Consultar el número de usuarios registrados en la app
    const { data, error } = await supabase.rpc("count_registered_users", {});

    if (error) {
      throw error;
    }

    console.log({ CRON_JOB_DATA: { activeUsers: data } });

    // Opciones del correo a enviar
    const mailContent = {
      to: process.env.SENDGRID_EMAIL as string,
      from: {
        name: "TeamFlow App",
        email: process.env.SENDGRID_EMAIL as string
      },
      subject: "Resultados del cron job de vercel",
      html: cronJobEmailTemplate({ activeUsers: data })
    };

    // Enviar el email
    await sendgrid.send(mailContent);

    return NextResponse.json({ CRON_JOB_DATA: { activeUsers: data } });

  } catch (error: any) {
    console.log(`Error consultando endpoint del cron job de vercel:`, error.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}