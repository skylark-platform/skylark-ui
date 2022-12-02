export type SkylarkObjectType = string;
export type SkylarkObjectTypes = SkylarkObjectType[];

export type NormalizedObjectFieldType =
  | "string"
  | "int"
  | "float"
  | "enum"
  | "datetime"
  | "date"
  | "time"
  | "email"
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
  relationships?: string[];
}

export interface SkylarkObjectOperations {
  get: Query | null;
  list: Query | null;
  create: Mutation;
  // update: Mutation;
  // delete: Mutation;
}

export interface SkylarkObjectMeta {
  name: SkylarkObjectType;
  fields: NormalizedObjectField[];
  operations: SkylarkObjectOperations;
}
