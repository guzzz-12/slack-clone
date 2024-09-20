export type UploadUrlData = {
  authorizationToken: string;
  bucketId: string;
  uploadUrl: string;
}

export type UploadResponseData = {
  accountId: string;
  contentLength: number;
  fileId: string;
  fileName: string;
}