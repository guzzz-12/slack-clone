import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { invitationEmailTemplate } from "@/utils/invitationEmailTemplate";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

const emailSchema = z.object({
  workspaceId: z
    .string()
    .uuid({message: "Invalid workspace ID"}),
  workspaceName: z
    .string()
    .min(1, {message: "The workspace name is required"}),
  email: z
    .string()
    .min(1, {message: "The email is required"})
    .email({message: "Invalid email address"})
});


// Route handler para enviar invitación a un usuario
export async function POST(req: NextRequest) {
  try {
    const { workspaceId, workspaceName, email } = await req.json();

    // Validar el email
    const {error} = emailSchema.safeParse({ workspaceId, workspaceName, email});

    if (error) {
      const errors = error.errors.map(err => err.message).join(". ");
      return NextResponse.json({message: errors}, {status: 400});
    }

    // Generar el token de invitación
    const token = jwt.sign({ workspaceId, email }, process.env.INVITATION_TOKEN_SECRET!, {expiresIn: "1d"});

    // Opciones del correo a enviar
    const mailContent = {
      to: email,
      from: {
        name: "Slack Clone",
        email
      },
      subject: "Invitation to Slack Clone",
      html: invitationEmailTemplate(email, workspaceName, token)
    };

    // Enviar el mensaje
    await sendgrid.send(mailContent);

    return NextResponse.json("Invitation sent successfully");
    
  } catch (error: any) {
    console.log(`Error enviando invitación`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}