import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import B2 from "backblaze-b2";
import slugify from "slugify";
import { v4 } from "uuid";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { WorkspaceFormSchema } from "@/utils/formSchemas";
import { UploadResponseData, UploadUrlData } from "@/types/backblaze";

// Inicializar Backblaze
const b2Client = new B2({
  applicationKeyId: process.env.BACKBLAZE_KEY_ID as string,
  applicationKey: process.env.BACKBLAZE_BUCKET_APPLICATION_KEY as string
});

export async function POST(req: NextRequest) {
  // ID de la imagen en el bucket para eliminarla en caso de que haya error creando el workspace
  let fileId = "";
  let fileName = "";

  try {
    const supabase = supabaseServerClient();

    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login");
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

    // Data de la respuesta de la subida al bucket
    const urlData = uploadUrl.data as UploadUrlData;

    // Nombre de la imagen
    const imageName = `${slug.substring(0, 40)}_${v4()}`

    // Extensión de la imagen
    const ext = image.type.split("/")[1];

    // Subir la imagen al bucket
    const uploadRes = await b2Client.uploadFile({
      uploadAuthToken: urlData.authorizationToken,
      uploadUrl: urlData.uploadUrl,
      data: buffer,
      fileName: `${imageName}.${ext}`
    });

    // Data de la imagen subida al bucket
    const uploadData = uploadRes.data as UploadResponseData;
    const uploadedImageUrl = `${process.env.BACKBLAZE_BUCKET_URL}/${uploadData.fileName}`;

    fileId = uploadData.fileId;
    fileName = uploadData.fileName;

    // Crear el workspace en la base de datos
    const {data: wsData, error: wsInsertError} = await supabase
      .from("workspaces")
      .insert({
        name,
        slug,
        image_url: uploadedImageUrl,
        admin_id: user.id
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