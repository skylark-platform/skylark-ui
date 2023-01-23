import {
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLObjectImage,
} from "./gqlObjects";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "./objectOperations";

export enum ParsedSkylarkObjectAvailabilityStatus {
  Active = "Active",
  Future = "Future",
  Expired = "Expired",
  Unavailable = "Unavailable",
}

export interface ParsedSkylarkObjectAvailability {
  status: ParsedSkylarkObjectAvailabilityStatus | null;
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

export type ParsedSkylarkObjectMetadata = {
  uid: string;
  external_id: string;
} & Record<string, SkylarkObjectMetadataField>;

export interface ParsedSkylarkObject {
  objectType: SkylarkObjectType;
  metadata: ParsedSkylarkObjectMetadata;
  availability: ParsedSkylarkObjectAvailability;
  images?: SkylarkGraphQLObjectImage[];
  relationships: string[];
}