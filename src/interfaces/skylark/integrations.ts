export interface IntegrationGenericUploadUrlResponseBody {
  custom: Record<string, unknown>;
  provider_name: string;
  type: "video" | "image";
  url: string;
  upload_id?: string;
}

export interface IntegrationCloudinaryUploadUrlResponseBody
  extends IntegrationGenericUploadUrlResponseBody {
  cloud_name: string;
}
