import {
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  SkylarkGraphQLAvailabilityDimensionValue,
  SkylarkGraphQLObjectImage,
  SkylarkObjectConfigFieldType,
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
  active: boolean;
  inherited: boolean;
  inheritanceSource: boolean;
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

export interface ParsedSkylarkObjectConfigFieldConfig {
  name: string;
  fieldType: SkylarkObjectConfigFieldType;
  position: number;
}

export interface ParsedSkylarkObjectConfig {
  colour?: string | null;
  primaryField?: string | null;
  objectTypeDisplayName?: string | null;
  fieldConfig?: ParsedSkylarkObjectConfigFieldConfig[];
}

export interface ParsedSkylarkObjectMeta {
  language: string;
  availableLanguages: string[];
  versions?: {
    language?: number;
    global?: number;
  };
  availabilityStatus: AvailabilityStatus | null;
  created?: string;
  modified?: string;
  published?: boolean;
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

export interface ParsedSkylarkObjectRelationship {
  name: string;
  objectType: SkylarkObjectType;
  objects: ParsedSkylarkObject[];
}

export type ParsedSkylarkObjectRelationships = Record<
  string,
  ParsedSkylarkObjectRelationship
>;

export interface ParsedSkylarkObjectTypeRelationshipConfiguration {
  [relationshipName: string]: {
    defaultSortField: string;
    inheritAvailability: boolean;
  };
}

export interface ParsedAvailabilityAssignedToObject {
  objectType: SkylarkObjectType;
  object: ParsedSkylarkObject;
  inherited: boolean;
  inheritedSource: boolean;
  active: boolean;
}

export interface ParsedSkylarkObjectAvailabilityInheritance {
  inheritedFrom: ParsedSkylarkObject[];
  inheritedBy: ParsedSkylarkObject[];
}
