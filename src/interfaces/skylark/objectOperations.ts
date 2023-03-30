export enum BuiltInSkylarkObjectType {
  Availability = "Availability",
  SkylarkImage = "SkylarkImage",
  BetaSkylarkImage = "Image",
}

export enum SkylarkSystemField {
  UID = "uid",
  ExternalID = "external_id",
  Slug = "slug",
  DataSourceID = "data_source_id",
  DataSourceFields = "data_source_fields",
  Availability = "availability",
  Content = "content", // "Set like" content
}

export enum SkylarkSystemGraphQLType {
  SkylarkImageListing = "SkylarkImageListing",
  BetaSkylarkImageListing = "ImageListing", // Remove after beta 1 envs are turned off
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

export interface NormalizedObjectField {
  name: string;
  type: NormalizedObjectFieldType;
  originalType: string;
  enumValues?: string[];
  isList: boolean;
  isRequired: boolean;
}

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
  get: Query | null;
  list: Query | null;
  create: Mutation;
  update: Mutation;
  delete: Mutation;
}

export interface SkylarkObjectFields {
  name: SkylarkObjectType;
  fields: NormalizedObjectField[];
}

export interface SkylarkObjectRelationship {
  relationshipName: string;
  objectType: SkylarkObjectType;
}

export interface SkylarkObjectMeta extends SkylarkObjectFields {
  availability: SkylarkObjectMeta | null;
  images: {
    objectMeta: SkylarkObjectMeta;
    relationshipNames: string[];
  } | null;
  operations: SkylarkObjectOperations;
  relationships: SkylarkObjectRelationship[];
  hasContent: boolean;
  hasRelationships: boolean;
}
