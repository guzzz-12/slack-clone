import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import sendgrid from "@sendgrid/mail";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { invitationEmailTemplate } from "@/utils/invitationEmailTemplate";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { isPostgresError } from "@/utils/constants";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

const emailSchema = z.object({
  workspaceId: z
    .string()
    .uuid({message: "Invalid workspace ID"}),
  workspaceName: z
    .string()
    .min(1, {message: "The workspace name is required"}),
  inviteCode: z
    .string()
    .min(1, {message: "The invite code is required"}),
  email: z
    .string()
    .min(1, {message: "The email is required"})
    .email({message: "Invalid email address"})
});


// Route handler para enviar invitación a un usuario
export async function POST(req: NextRequest) {
  const supabase = supabaseServerClient();

  try {
    const { workspaceId, workspaceName, inviteCode, email } = await req.json();

    // Validar el email
    const {error} = emailSchema.safeParse({ workspaceId, workspaceName, inviteCode, email});

    if (error) {
      const errors = error.errors.map(err => err.message).join(". ");
      return NextResponse.json({message: errors}, {status: 400});
    }

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    } 

    // Generar el token de invitación
    const token = jwt.sign({ workspaceId, inviteCode, email }, process.env.INVITATION_TOKEN_SECRET!, {expiresIn: "24h"});

    // Eliminar el token de invitación anterior si existe
    const {error: deleteError} = await supabase
    .from("invitation_tokens")
    .delete()
    .eq("email", email)
    .eq("workspace_id", workspaceId);

    if (deleteError) {
      throw deleteError;
    }

    // Verificar si el usuario ya forma parte del workspace
    const {data: invitedUserData, error: invitedUserError} = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1);

    if (invitedUserError) {
      throw invitedUserError;
    }

    if (invitedUserData.length > 0) {
      const {data: isMember, error: isMemberError} = await supabase
      .from("members_workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", invitedUserData[0].id)
      .limit(1);
  
      if (isMemberError) {
        throw isMemberError;
      }
  
      if (isMember.length > 0) {
        return NextResponse.json({message: "There's already a member with this email"}, {status: 400});
      }
    }


    // Verificar si el usuario que hizo la ivitación es el admin del workspace
    const {data: workspaceAdminData, error: workspaceAdminError} = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("admin_id", user.id)
      .limit(1);
    
    if (workspaceAdminError) {
      throw workspaceAdminError;
    }

    if (workspaceAdminData.length === 0) {
      return NextResponse.json({message: "You are not allowed to perform this action"}, {status: 403});
    }

    // Insertar el token en la base de datos
    const {error: insertError} = await supabase
    .from("invitation_tokens")
    .insert({
      workspace_id: workspaceId,
      email,
      token
    });

    if (insertError) {
      throw insertError;
    }

    // Opciones del correo a enviar
    // const mailContent = {
    //   to: email,
    //   from: {
    //     name: "TeamFlow App",
    //     email
    //   },
    //   subject: "Invitation to TeamFlow",
    //   html: invitationEmailTemplate(email, workspaceName, token)
    // };

    // Enviar el email de invitación
    // await sendgrid.send(mailContent);

    return NextResponse.json({
      invitationLink: `${process.env.NEXT_PUBLIC_PROJECT_URL!}/invite?token=${token}`
    });
    
  } catch (error: any) {
    console.log(`Error enviando invitación`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}


// Route handler para procesar la invitación
export async function GET(req: NextRequest) {
  const supabase = supabaseServerClient();

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({message: "Invalid token"}, {status: 400});
    }

    const decodedToken = jwt.verify(token, process.env.INVITATION_TOKEN_SECRET!) as {workspaceId: string, inviteCode: string, email: string};

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    }

    // Verificar si el workspace existe en la base de datos    
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", decodedToken.workspaceId)
      .limit(1);
    
    if (workspaceError) {
      throw workspaceError;
    }

    if (!workspace[0]) {
      return NextResponse.json({message: "Workspace not found"}, {status: 404});
    }

    // Verificar si ya es miembro del workspace
    const {data: isMember, error: memberError} = await supabase
      .from("members_workspaces")
      .select("*")
      .eq("workspace_id", workspace[0].id)
      .eq("user_id", user.id)
      .limit(1);
    
    if (memberError) {
      throw memberError;
    }

    if (isMember[0]) {
      return NextResponse.json(
        {message: `You are already a member of ${workspace[0].name}`},
        {status: 400}
      );
    }

    // Verificar si el token coincide con el token almacenado en la base de datos
    const {data: invitationToken, error: invitationTokenError} = await supabase
      .from("invitation_tokens")
      .select("token")
      .eq("email", decodedToken.email)
      .limit(1);
    
    if (invitationTokenError) {
      throw invitationTokenError;
    }

    if (!invitationToken[0]) {
      return NextResponse.json({message: "You are not invited to this workspace"}, {status: 403});
    }

    if (invitationToken[0].token !== token) {
      return NextResponse.json({message: "Invalid token"}, {status: 400});
    }

    const inviteCode = workspace[0].invite_code;

    // Verificar si el inviteCode es válido
    if (inviteCode !== decodedToken.inviteCode) {
      return NextResponse.json({message: "Invalid invite code"}, {status: 400});
    }

    // Agregar el usuario a los miembros del workspace
    const {error: workspaceMemberError} = await supabase
      .from("members_workspaces")
      .insert({
        workspace_id: workspace[0].id,
        user_id: user.id
      });

    if (workspaceMemberError) {
      throw workspaceMemberError;
    }
    
    // Eliminar el token de invitación
    const {error: deleteInvitationTokenError} = await supabase
      .from("invitation_tokens")
      .delete()
      .eq("email", decodedToken.email)
      .eq("workspace_id", workspace[0].id);
    
    if (deleteInvitationTokenError) {
      throw deleteInvitationTokenError;
    }

    return NextResponse.json(workspace[0]);

  } catch (error: any) {
    if (isPostgresError(error)) {
      const {message, code} = error;

      console.log(`Error PostgreSQL confirmando invitación al workspace: ${message}, code: ${code}`);

      // Verificar si el error es de channel no encontrado
      if (code === "PGRST116") {
        return NextResponse.json({message: "Workspace not found"}, {status: 404});
      }
    }

    console.log(`Error procesando invitación`, error);

    // Chequear si es error de jwt expirado
    if (error.name === "TokenExpiredError") {
      return NextResponse.json({message: "Invitation link expired"}, {status: 400});
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}