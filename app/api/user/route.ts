import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { v4 } from "uuid";
import { isPostgresError } from "@/utils/constants";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { b2Client } from "@/utils/backblaze";
import { UploadResponseData, UploadUrlData } from "@/types/backblaze";

export async function PATCH(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const avatar = formData.get("avatar") as File | undefined;
    let avatarUrl: string | null = "";
    let avatarName: string | null = "";
    let avatarId: string | null = "";

    const supabase = supabaseServerClient();

    const {data: currentUser} = await supabase.auth.getUser();

    if (!currentUser.user) {
      return redirect("/signin");
    }

    // Consultar el perfil del usuario
    const {data: userProfile, error: userProfileError} = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.user.id)
      .single();

    if (userProfileError) {
      throw userProfileError;
    }

    // Verificar si se ha enviado una imagen y subirla
    // dal bucket luego de eliminar la anterior si existe
    if (avatar) {
      // Convertir la imagen en buffer para que sea compatible con backblaze
      const buffer = Buffer.from(await avatar.arrayBuffer());
  
      // Autorizar backblaze
      await b2Client.authorize();

      // Eliminar la imagen anterior del bucket si existe
      if (userProfile.avatar_id) {
        await b2Client.deleteFileVersion({
          fileId: userProfile.avatar_id as string,
          fileName: userProfile.avatar_name as string
        });
      }

      // Generar la url de subida del archivo
      const uploadUrl = await b2Client.getUploadUrl({
        bucketId: process.env.BACKBLAZE_BUCKET_ID as string,
      });
  
      // Data de la url de subida del archivo al bucket
      const urlData = uploadUrl.data as UploadUrlData;

      // Subir la imagen al bucket
      const uploadRes = await b2Client.uploadFile({
        uploadAuthToken: urlData.authorizationToken,
        uploadUrl: urlData.uploadUrl,
        data: buffer,
        fileName: `user-avatars/${currentUser.user.id}/${v4()}.webp`,
      });

      // Data de la imagen subida al bucket
      const uploadData = uploadRes.data as UploadResponseData;

      avatarUrl = `${process.env.BACKBLAZE_BUCKET_URL}/${uploadData.fileName}`;
      avatarName = uploadRes.data.fileName;
      avatarId = uploadRes.data.fileId;
    }

    const {data: updatedUserData, error} = await supabase
    .from("users")
    .update({
      name,
      ...(avatarName && avatarUrl && avatarId ? {avatar_url: avatarUrl, avatar_name: avatarName, avatar_id: avatarId} : {}),
    })
    .eq("id", currentUser.user.id)
    .select("*")
    .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedUserData);
    
  } catch (error: any) {
    let message = error.message;

    if (isPostgresError(error)) {
      const {message, code} = error;
      console.log(`Error PostgreSQL actualizando perfil del usuario: ${message}, code: ${code}`);

    } else {
      console.log(`Error actualizando perfil del usuario: ${message}`, error);      
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}