import {
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLObjectImage,
} from "./gqlObjects";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "./objectOperations";

export type SkylarkUID = string;
export type SkylarkExternalId = string | null;

export enum AvailabilityStatus {
  Active = "Active",
  Future = "Future",
  Expired = "Expired",
  Unavailable = "Unavailable",
}

export interface ParsedSkylarkObjectAvailabilityObject {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  title: string;
  slug: string;
  start: string;
  end: string;
  timezone: string;
  neverExpires: boolean;
  status: AvailabilityStatus | null;
  dimensions: SkylarkGraphQLAvailabilityDimension[];
}

export interface ParsedSkylarkObjectAvailability {
  status: AvailabilityStatus | null;
  objects: ParsedSkylarkObjectAvailabilityObject[];
}

export interface ParsedSkylarkObjectContentObject {
  objectType: SkylarkObjectType;
  config: ParsedSkylarkObjectConfig;
  object: ParsedSkylarkObjectMetadata;
  position: number;
}

export interface AddedSkylarkObjectContentObject
  extends ParsedSkylarkObjectContentObject {
  isNewObject?: boolean;
}

export interface ParsedSkylarkObjectContent {
  objects: ParsedSkylarkObjectContentObject[];
}

export type ParsedSkylarkObjectMetadata = {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
} & Record<string, SkylarkObjectMetadataField>;

export interface ParsedSkylarkObjectConfig {
  colour?: string;
  primaryField?: string;
}

export interface ParsedSkylarkObjectMeta {
  availableLanguages?: string[];
}

export interface ParsedSkylarkObject {
  objectType: SkylarkObjectType;
  uid: SkylarkUID;
  config: ParsedSkylarkObjectConfig;
  meta: ParsedSkylarkObjectMeta;
  metadata: ParsedSkylarkObjectMetadata;
  availability: ParsedSkylarkObjectAvailability;
  images?: SkylarkGraphQLObjectImage[];
  relationships: string[];
  content?: ParsedSkylarkObjectContent;
}

export interface ParsedSkylarkObjectRelationships {
  relationshipName: string;
  nextToken?: string | null;
  objects: ParsedSkylarkObject[];
}
