import { GQLScalars } from "src/interfaces/graphql/introspection";

export enum BuiltInSkylarkObjectType {
  Availability = "Availability",
  SkylarkImage = "SkylarkImage",
  SkylarkFavoriteList = "SkylarkFavoriteList",
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

export enum SkylarkSystemGraphQLType {
  SkylarkImageListing = "SkylarkImageListing",
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
  originalType: GQLScalars;
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
  list?: Query | null;
  create: Mutation;
  update: Mutation;
  delete: Mutation;
}

export interface SkylarkObjectFields {
  name: SkylarkObjectType;
  fields: NormalizedObjectField[];
  fieldConfig: {
    global: string[];
    translatable: string[];
  };
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
  hasContentOf: boolean;
  hasRelationships: boolean;
  hasAvailability: boolean;
  isTranslatable: boolean;
  isImage: boolean;
}
