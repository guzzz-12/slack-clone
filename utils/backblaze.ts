import B2 from "backblaze-b2";

/** Cliente de Backblaze */
export const b2Client = new B2({
  applicationKeyId: process.env.BACKBLAZE_APPLICATION_KEY_ID as string,
  applicationKey: process.env.BACKBLAZE_APPLICATION_KEY as string
});