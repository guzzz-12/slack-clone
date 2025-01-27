import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { pusher } from "@/utils/pusher";

// Ruta para actualizar la presencia del usuario
export async function POST(req: NextRequest) {
  try {
    const {isAway} = await req.json() as {isAway: boolean};

    if (typeof isAway !== "boolean") {
      return NextResponse.json({message: "Invalid is_away value"}, {status: 400});
    }

    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    }

    const {error} = await supabase
    .from("users")
    .update({is_away: isAway})
    .eq("id", user.id);

    if (error) {
      throw error;
    }

    await pusher.trigger(`member-${user.id}`, "user-presence", {isAway});

    return NextResponse.json("success");
    
  } catch (error: any) {
    let message = error.message;

    console.log(`Error actualizando la presencia del usuario: ${message}`);

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}