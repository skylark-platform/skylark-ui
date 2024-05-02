import { FlatfileRow } from "./flatfile/responses";

export interface ApiRouteTemplateData {
  embedId: string;
  token: string;
}
export interface ApiRouteFlatfileImportRequestBody {
  batchId: string;
  limit: number;
  offset?: number;
}

export interface ApiRouteFlatfileImportResponse {
  rows: FlatfileRow[];
  totalRows: number;
}

export interface ApiRouteWowzaUploadUrlRequestBody {
  uploadUrl: string;
}
