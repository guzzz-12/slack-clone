import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/supabaseMiddleware";

export async function middleware(request: NextRequest) {
  // Excluir del middleware los endpoints de autenticación
  if (request.nextUrl.pathname.includes("/api/auth")) {
    return NextResponse.next();
  }

  // Excluir del middleware el endpoint del cron job de vercel
  if (request.nextUrl.pathname.includes("/api/cron")) {
    return NextResponse.next();
  }

  // Excluir del middleware los endpoints de Socket.io (deprecado)
  if (request.nextUrl.pathname.includes("/api/socket/io")) {
    return NextResponse.next();
  }

  // Excluir del middleware la página de invite
  if (request.nextUrl.pathname.includes("/invite")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ],
}