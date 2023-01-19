export enum BuiltInSkylarkObjectType {
  Availability = "Availability",
  Image = "Image",
}

export type SkylarkObjectType = string | BuiltInSkylarkObjectType;
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

// TODO should this live here?
interface ObjectAvailabilityDimension {
  title: string;
  slug: string;
  values: {
    title: string;
    slug: string;
    description: string;
  }[];
}

export interface ObjectAvailability {
  title: string;
  slug: string;
  start: string;
  end: string;
  dimensions: ObjectAvailabilityDimension[];
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
  availability: SkylarkObjectMeta | null;
  operations: SkylarkObjectOperations;
}

export type SkylarkGraphQLObject = {
  __typename: string;
  uid: string;
  external_id: string;
} & Record<string, string | number | boolean>;
