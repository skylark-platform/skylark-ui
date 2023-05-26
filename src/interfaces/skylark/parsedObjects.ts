import {
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  SkylarkGraphQLAvailabilityDimensionValue,
  SkylarkGraphQLObjectImage,
} from "./gqlObjects";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "./objectOperations";

export type SkylarkUID = string;
export type SkylarkExternalId = string | null;

export interface SkylarkObjectIdentifier {
  uid: SkylarkUID;
  objectType: SkylarkObjectType;
  language: string;
}

export enum AvailabilityStatus {
  Active = "Active",
  Future = "Future",
  Expired = "Expired",
  Unavailable = "Unavailable",
}

export interface ParsedSkylarkDimensionsWithValues
  extends SkylarkGraphQLAvailabilityDimension {
  values: SkylarkGraphQLAvailabilityDimensionValue[];
}

export interface ParsedSkylarkObjectAvailabilityObject {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  title: string;
  slug: string;
  start: string;
  end: string;
  timezone: string;
  dimensions: SkylarkGraphQLAvailabilityDimensionWithValues[];
}

export interface ParsedSkylarkObjectAvailability {
  status: AvailabilityStatus | null;
  objects: ParsedSkylarkObjectAvailabilityObject[];
}

export interface ParsedSkylarkObjectContentObject {
  objectType: SkylarkObjectType;
  config: ParsedSkylarkObjectConfig;
  meta: ParsedSkylarkObjectMeta;
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
  objectTypeDisplayName?: string;
}

export interface ParsedSkylarkObjectMeta {
  language: string;
  availableLanguages: string[];
  versions?: {
    language?: number;
    global?: number;
  };
  availabilityStatus: AvailabilityStatus | null;
}

export interface ParsedSkylarkObjectImageRelationship {
  relationshipName: string;
  objects: SkylarkGraphQLObjectImage[];
}

export interface ParsedSkylarkObject {
  objectType: SkylarkObjectType;
  uid: SkylarkUID;
  config: ParsedSkylarkObjectConfig;
  meta: ParsedSkylarkObjectMeta;
  metadata: ParsedSkylarkObjectMetadata;
  availability: ParsedSkylarkObjectAvailability;
  images?: ParsedSkylarkObjectImageRelationship[];
  content?: ParsedSkylarkObjectContent;
}

export interface ParsedSkylarkObjectRelationships {
  relationshipName: string;
  nextToken?: string | null;
  objects: ParsedSkylarkObject[];
}
