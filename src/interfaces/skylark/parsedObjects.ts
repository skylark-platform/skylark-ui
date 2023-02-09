import {
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLObjectImage,
} from "./gqlObjects";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "./objectOperations";

export enum AvailabilityStatus {
  Active = "Active",
  Future = "Future",
  Expired = "Expired",
  Unavailable = "Unavailable",
}

export interface ParsedSkylarkObjectAvailability {
  status: AvailabilityStatus | null;
  objects: {
    uid: string;
    external_id: string;
    title: string;
    slug: string;
    start: string;
    end: string;
    timezone: string;
    dimensions: SkylarkGraphQLAvailabilityDimension[];
  }[];
}

export interface ParsedSkylarkObjectContent {
  objects: {
    objectType: SkylarkObjectType;
    config: ParsedSkylarkObjectConfig;
    object: ParsedSkylarkObjectMetadata;
    position: number;
  }[];
}

export type ParsedSkylarkObjectMetadata = {
  uid: string;
  external_id: string;
} & Record<string, SkylarkObjectMetadataField>;

export interface ParsedSkylarkObjectConfig {
  colour?: string;
  primaryField?: string;
}

export interface ParsedSkylarkObject {
  objectType: SkylarkObjectType;
  uid: string;
  config: ParsedSkylarkObjectConfig;
  metadata: ParsedSkylarkObjectMetadata;
  availability: ParsedSkylarkObjectAvailability;
  images?: SkylarkGraphQLObjectImage[];
  relationships: string[];
  content?: ParsedSkylarkObjectContent;
}
