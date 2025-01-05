import browserImageCompression from "browser-image-compression";

/**
 * Convertir la imagen a base64
 */
export const imgToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.readAsDataURL(file);

    fileReader.onload = () => {
      resolve(fileReader.result?.toString() || "")
    };

    fileReader.onerror = (err) => reject(err)
  })
};


/**
 * Comprimir una imagen a webp de máximo
 * 3 MB o 2400px en su dimensión mayor
 */
export const imageCompressor = async (file: File, type: "file" | "base64"): Promise<File | string> => {
  try {
    const compressedImage = await browserImageCompression(file, {
      fileType: "image/webp",
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2400,
      initialQuality: 0.85,
      useWebWorker: true
    });

    if (type === "base64") {
      const imageBase64 = await imgToBase64(compressedImage);
      return imageBase64;
    };

    // Convert the Blob to a File
    const compressedImageFile: File = new File([compressedImage], file.name, {
      type: "image/webp"
    });

    return compressedImageFile;
    
  } catch (error: any) {
    console.log(error.message);
    throw new Error(error.message);
  }
};