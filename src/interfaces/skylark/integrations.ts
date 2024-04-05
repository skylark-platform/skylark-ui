export interface IntegrationGenericUploadUrlResponseBody {
  custom: Record<string, unknown>;
  provider_name: string;
  type: "video" | "image";
  url: string;
}

export interface IntegrationCloudinaryUploadUrlResponseBody
  extends IntegrationGenericUploadUrlResponseBody {
  cloud_name: string;
}
