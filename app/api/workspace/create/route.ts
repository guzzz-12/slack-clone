import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { v4 } from "uuid";
import crypto from "crypto";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { WorkspaceFormSchema } from "@/utils/formSchemas";
import { UploadResponseData, UploadUrlData } from "@/types/backblaze";
import { b2Client } from "@/utils/backblaze";


/** Route handler para crear un workspace */
export async function POST(req: NextRequest) {
  // ID de la imagen en el bucket para eliminarla en caso de que haya error creando el workspace
  let fileId = "";
  let fileName = "";

  try {
    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/signin");
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;
    const slug = slugify(name, {lower: true});

    // Validar la data del formulario
    const {error} = WorkspaceFormSchema.safeParse({name, image});

    // Verificar si hay errores de validación
    if (error) {
      const errors = error.errors.map(err => err.message).join(". ");
      return NextResponse.json({message: errors}, {status: 400});
    }

    // Convertir la imagen en buffer para que sea compatible con backblaze
    const buffer = Buffer.from(await image.arrayBuffer());

    // Autorizar backblaze
    await b2Client.authorize();

    // Generar la url de subida del archivo
    const uploadUrl = await b2Client.getUploadUrl({
      bucketId: process.env.BACKBLAZE_BUCKET_ID as string,
    });

    // Data de la url de subida del archivo al bucket
    const urlData = uploadUrl.data as UploadUrlData;

    // Generar ID del workspace
    const wsId = v4();

    // Nombre de la imagen
    const imageName = `ws_id_${wsId}.webp`;

    // Subir la imagen al bucket
    const uploadRes = await b2Client.uploadFile({
      uploadAuthToken: urlData.authorizationToken,
      uploadUrl: urlData.uploadUrl,
      data: buffer,
      fileName: `workspaces/${wsId}/${imageName}`,
    });

    // Data de la imagen subida al bucket
    const uploadData = uploadRes.data as UploadResponseData;
    const uploadedImageUrl = `${process.env.BACKBLAZE_BUCKET_URL}/${uploadData.fileName}`;

    fileId = uploadData.fileId;
    fileName = uploadData.fileName;

    // Generar el invite code del workspace
    const inviteCode = crypto.randomBytes(16).toString("hex");

    // Crear el workspace en la base de datos
    const {data: wsData, error: wsInsertError} = await supabase
      .from("workspaces")
      .insert({
        id: wsId,
        name,
        slug,
        image_url: uploadedImageUrl,
        image_key: fileId,
        image_name: imageName,
        admin_id: user.id,
        invite_code: inviteCode
      })
      .select("*")
      .limit(1)
      .single();
    
    if (wsInsertError) {
      throw new Error(`wsInsertError_${wsInsertError.message}`);
    }

    return NextResponse.json(wsData);
    
  } catch (error: any) {
    console.log(`Error creando Workspace`, error.message);

    // Eliminar la imagen del bucket en caso de error de supabase
    if ((error.message as string).startsWith("wsInsertError_")) {
      b2Client.deleteFileVersion({fileId, fileName});
    }

    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}