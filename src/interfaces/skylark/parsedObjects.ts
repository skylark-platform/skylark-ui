import { IntegrationUploaderPlaybackPolicy } from "src/components/integrations";

import {
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  SkylarkGraphQLAvailabilityDimensionValue,
  SkylarkGraphQLObjectImage,
  SkylarkObjectConfigFieldType,
} from "./gqlObjects";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "./objectOperations";

export type SkylarkUID = string;
export type SkylarkExternalId = string | null;

export type SkylarkObjectIdentifier<T = BuiltInSkylarkObjectType | string> = {
  uid: SkylarkUID;
  externalId: string | null;
  type: string | null;
  objectType: T;
  language: string;
  availableLanguages: ParsedSkylarkObjectMeta["availableLanguages"];
  availabilityStatus: AvailabilityStatus | null;
  display: {
    name: string;
    objectType: string;
    colour: ParsedSkylarkObjectConfig["colour"];
  };
  created: ParsedSkylarkObjectMeta["created"];
  modified: ParsedSkylarkObjectMeta["modified"];
} & (
  | {
      objectType: BuiltInSkylarkObjectType.SkylarkImage;
      contextualFields: {
        url: string;
      };
    }
  | {
      objectType: BuiltInSkylarkObjectType.Availability;
      contextualFields: {
        start: string | null;
        end: string | null;
      };
    }
  | {
      objectType:
        | BuiltInSkylarkObjectType.SkylarkAsset
        | BuiltInSkylarkObjectType.SkylarkLiveAsset;
      contextualFields: Record<string, SkylarkObjectMetadataField> & {
        playbackPolicy: IntegrationUploaderPlaybackPolicy | null;
      };
    }
  | { objectType: string; contextualFields: undefined }
);

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
  title: string | null;
  slug: string | null;
  start: string | null;
  end: string | null;
  timezone: string | null;
  active: boolean;
  inherited: boolean;
  inheritanceSource: boolean;
  dimensions: SkylarkGraphQLAvailabilityDimensionWithValues[];
}

export interface ParsedSkylarkObjectAvailability {
  status: AvailabilityStatus | null;
  objects: ParsedSkylarkObjectAvailabilityObject[];
}

export interface SkylarkObjectContentObject {
  objectType: SkylarkObjectType;
  // config: ParsedSkylarkObjectConfig;
  // meta: ParsedSkylarkObjectMeta;
  object: SkylarkObjectIdentifier;
  position: number;
  isDynamic: boolean;
}

export interface AddedSkylarkObjectContentObject
  extends SkylarkObjectContentObject {
  isNewObject?: boolean;
}

export interface SkylarkObjectContent {
  objects: SkylarkObjectContentObject[];
}

export interface ParsedSkylarkObjectMetadata
  extends Record<string, SkylarkObjectMetadataField> {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  type: string | null;
}

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
  versions: {
    language?: number;
    global?: number;
  };
  availabilityStatus: AvailabilityStatus | null;
  created?: string;
  modified?: string;
  published?: boolean;
}

export interface SkylarkObjectImageRelationship {
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
  images?: SkylarkObjectImageRelationship[];
  content?: SkylarkObjectContent;
}

export interface SkylarkObjectRelationship<
  T = BuiltInSkylarkObjectType | string,
> {
  name: string;
  objectType: SkylarkObjectType;
  objects: SkylarkObjectIdentifier<T>[];
}

export type SkylarkObjectRelationships<T = BuiltInSkylarkObjectType | string> =
  Record<string, SkylarkObjectRelationship<T>>;

export interface ParsedSkylarkRelationshipConfig {
  defaultSortField: string;
  inheritAvailability: boolean;
}

export interface ParsedSkylarkObjectTypeRelationshipConfiguration {
  [relationshipName: string]: ParsedSkylarkRelationshipConfig;
}

export interface AvailabilityAssignedToObject {
  objectType: SkylarkObjectType;
  object: SkylarkObjectIdentifier;
  inherited: boolean;
  inheritanceSource: boolean;
  active: boolean;
}

export interface ParsedSkylarkObjectAvailabilityInheritance {
  inheritedFrom: ParsedSkylarkObject[];
  inheritedBy: ParsedSkylarkObject[];
}
