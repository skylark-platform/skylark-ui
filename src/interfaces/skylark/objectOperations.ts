import { GQLScalars } from "src/interfaces/graphql/introspection";

import { ParsedSkylarkObjectConfigFieldConfig } from "./parsedObjects";

export enum BuiltInSkylarkObjectType {
  Availability = "Availability",
  AudienceSegment = "AudienceSegment",
  SkylarkImage = "SkylarkImage",
  SkylarkAsset = "SkylarkAsset",
  SkylarkLiveAsset = "SkylarkLiveAsset",
  SkylarkFavoriteList = "SkylarkFavoriteList",
  SkylarkSet = "SkylarkSet",
}

export enum SkylarkSystemField {
  UID = "uid",
  ExternalID = "external_id",
  Slug = "slug",
  DataSourceID = "data_source_id",
  DataSourceFields = "data_source_fields",
  Availability = "availability",
  Content = "content", // "Set like" content
  ContentOf = "content_of", // The reverse of Content, will return any Sets the object belongs to
  Type = "type",
}

export enum SkylarkAvailabilityField {
  Start = "start",
  End = "end",
  Timezone = "timezone",
  Title = "title",
  DimensionBreakdown = "dimension_breakdown",
}

export type SkylarkObjectType = string | BuiltInSkylarkObjectType;
export type SkylarkObjectTypes = SkylarkObjectType[];
export type SkylarkObjectMetadataField =
  | null
  | string
  | string[]
  | number
  | boolean;

export type NormalizedObjectFieldType =
  | "string"
  | "int"
  | "float"
  | "enum"
  | "datetime"
  | "date"
  | "time"
  | "timestamp"
  | "email"
  | "url"
  | "ipaddress"
  | "json"
  | "phone"
  | "boolean";

export type NormalizedObjectField = {
  name: string;
  type: NormalizedObjectFieldType;
  originalType: GQLScalars;
  enumValues?: string[];
  isList: boolean;
  isRequired: boolean;
  isTranslatable: boolean;
  isGlobal: boolean;
  isUnversioned: boolean;
};

export type InputFieldWithFieldConfig = {
  field: NormalizedObjectField;
  config?: ParsedSkylarkObjectConfigFieldConfig;
};

interface BaseQueryMutation {
  type: "Query" | "Mutation";
  name: string;
}

interface Query extends BaseQueryMutation {
  type: "Query";
}

interface Mutation extends BaseQueryMutation {
  type: "Mutation";
  inputs: NormalizedObjectField[];
  argName: string;
}

export interface SkylarkObjectOperations {
  get: Query;
  list: Query | null;
  create: Mutation;
  update: Mutation;
  delete: Mutation;
}

export type SkylarkObjectMetaRelationship = {
  relationshipName: string;
  reverseRelationshipName: string | null;
  objectType: SkylarkObjectType;
};

export interface SkylarkObjectMeta {
  name: SkylarkObjectType;
  fields: {
    all: NormalizedObjectField[];
    allNames: string[];
    global: NormalizedObjectField[];
    translatable: NormalizedObjectField[];
    globalNames: string[];
    translatableNames: string[];
  };
  availability: SkylarkObjectMeta | null;
  builtinObjectRelationships?: {
    hasAssets: boolean;
    hasLiveAssets: boolean;
    // Legacy, should be changed to use boolean value only
    images: {
      objectMeta: SkylarkObjectMeta;
      relationshipNames: string[];
    } | null;
  };
  operations: SkylarkObjectOperations;
  relationships: SkylarkObjectMetaRelationship[];
  hasContent: boolean;
  hasContentOf: boolean;
  hasRelationships: boolean;
  hasAvailability: boolean;
  isTranslatable: boolean;
  isImage: boolean;
  isSet: boolean;
  isBuiltIn: boolean;
}
