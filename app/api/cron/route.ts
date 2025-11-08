import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { cronJobEmailTemplate } from "@/utils/cronJobEmailTemplate";

export const dynamic = "force-dynamic";

// Inicializar cliente de nodemailer
const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASSWORD
  }
});

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

    // Enviar el email a mailtrap
    await transport.sendMail({
      to: process.env.MAILTRAP_EMAIL as string,
      from: {
        name: "TeamFlow App",
        address: process.env.MAILTRAP_EMAIL as string,
      },
      subject: "TeamFlow Cron Job",
      html: cronJobEmailTemplate({activeUsers: data})
    });

    return NextResponse.json({ CRON_JOB_DATA: { activeUsers: data } });

  } catch (error: any) {
    console.log(`Error consultando endpoint del cron job de vercel:`, error.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}