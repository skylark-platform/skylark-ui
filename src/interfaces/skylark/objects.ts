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
  argName: string;
  relationships?: string[];
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
  hasImages?: boolean;
}

export interface SkylarkObjectMeta extends SkylarkObjectFields {
  operations: SkylarkObjectOperations;
}

export type SkylarkGraphQLObject = {
  __typename: string;
  uid: string;
  external_id: string;
} & Record<string, string | number | boolean>;
