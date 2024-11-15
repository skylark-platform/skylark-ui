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

export interface SkylarkObjectIdentifier<
  T = BuiltInSkylarkObjectType | string,
> {
  uid: SkylarkUID;
  objectType: T;
  language: string;
}

export type SkylarkObject<T = BuiltInSkylarkObjectType | string> =
  SkylarkObjectIdentifier<T> & {
    externalId: string | null;
    type: string | null;
    availableLanguages: ParsedSkylarkObjectMeta["availableLanguages"];
    availabilityStatus: AvailabilityStatus | null;
    display: {
      name: string;
      objectType: string;
      colour: ParsedSkylarkObjectConfig["colour"];
    };
    created: ParsedSkylarkObjectMeta["created"];
    modified: ParsedSkylarkObjectMeta["modified"];
    additionalFields?: Record<string, SkylarkObjectMetadataField>;
  } & (
      | {
          objectType: BuiltInSkylarkObjectType.SkylarkImage;
          contextualFields: {
            url: string | null;
            external_url: string | null;
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
      | { objectType: string; contextualFields: null }
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

export type SkylarkObjectContentObject = SkylarkObject & {
  position: number;
  isDynamic: boolean;
};

export type AddedSkylarkObjectContentObject = SkylarkObjectContentObject & {
  isNewObject?: boolean;
};

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
  hasDynamicContent?: boolean;
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

export interface ParsedSkylarkRelationshipConfig {
  defaultSortField: string | null;
  inheritAvailability: boolean | null;
}

export interface SkylarkObjectRelationship<
  T = BuiltInSkylarkObjectType | string,
> {
  name: string;
  objectType: SkylarkObjectType;
  objects: SkylarkObject<T>[];
  config: ParsedSkylarkRelationshipConfig;
}

export type SkylarkObjectRelationships<T = BuiltInSkylarkObjectType | string> =
  Record<string, SkylarkObjectRelationship<T>>;

export interface ParsedSkylarkObjectTypeRelationshipConfiguration {
  [relationshipName: string]: ParsedSkylarkRelationshipConfig;
}

export interface AvailabilityAssignedToObject {
  objectType: SkylarkObjectType;
  object: SkylarkObject;
  inherited: boolean;
  inheritanceSource: boolean;
  active: boolean;
}

export interface ParsedSkylarkObjectAvailabilityInheritance {
  inheritedFrom: ParsedSkylarkObject[];
  inheritedBy: ParsedSkylarkObject[];
}
