import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import B2 from "backblaze-b2";
import slugify from "slugify";
import { supabaseServerClient } from "@/utils/supabase/supabaseServerClient";
import { WorkspaceFormSchema } from "@/utils/formSchemas";
import { UploadResponseData, UploadUrlData } from "@/types/backblaze";

// Inicializar Backblaze
const b2Client = new B2({
  applicationKeyId: process.env.BACKBLAZE_KEY_ID as string,
  applicationKey: process.env.BACKBLAZE_BUCKET_APPLICATION_KEY as string
});

export async function POST(req: NextRequest) {
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

    const urlData = uploadUrl.data as UploadUrlData;

    // Nombre de la imagen
    const imageName = image.name
      .split(".")
      .slice(0, image.name.split(".").length -1)
      .join("_")
      .replaceAll(/[\-\s\.]/g, "_");

    // Extensión de la imagen
    const ext = image.type.split("/")[1];

    // Subir la imagen al bucket
    const uploadRes = await b2Client.uploadFile({
      uploadAuthToken: urlData.authorizationToken,
      uploadUrl: urlData.uploadUrl,
      data: buffer,
      fileName: `${imageName}_${Date.now()}.${ext}`
    });

    // Data de la imagen subida al bucket
    const uploadData = uploadRes.data as UploadResponseData;
    const uploadedImageUrl = `${process.env.BACKBLAZE_BUCKET_URL}/${uploadData.fileName}`;

    // Crear el workspace en la base de datos
    const workspace = await supabaseServerClient()
      .from("workspaces")
      .insert({
        name,
        slug,
        image_url: uploadedImageUrl,
        admin_id: user.id
      })
      .select("*");

    return NextResponse.json(workspace.data);
    
  } catch (error: any) {
    console.log(`Error creando Workspace`, error.message);
    return NextResponse.json({message: "Internal server error"}, {status: 500});
  }
}