export enum BuiltInSkylarkObjectType {
  Availability = "Availability",
  Image = "Image",
  Asset = "Asset",
  Set = "Set",
}

export enum BuiltInSkylarkFields {
  Content = "content", // "Set like" content
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
  images: SkylarkObjectMeta | null;
  operations: SkylarkObjectOperations;
  relationships: SkylarkObjectRelationship[];
}
