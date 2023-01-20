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

export enum ObjectAvailabilityStatus {
  Active = "Active",
  Future = "Future",
  Expired = "Expired",
  Unavailable = "Unavailable",
}

export interface ObjectAvailability {
  status: ObjectAvailabilityStatus | null;
  objects: {
    uid: string;
    external_id: string;
    title: string;
    slug: string;
    start: string;
    end: string;
    timezone: string;
    dimensions: ObjectAvailabilityDimension[];
  }[];
}
export interface ObjectImage {
  title: string;
  url: string;
  uid: string;
  slug: string;
  type: string;
  external_id: string;
  description: string;
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
}

export interface SkylarkObjectMeta extends SkylarkObjectFields {
  availability: SkylarkObjectMeta | null;
  images: SkylarkObjectMeta | null;
  operations: SkylarkObjectOperations;
}

export interface SkylarkGraphQLAvailability {
  title: string;
  slug: string;
  start: string;
  end: string;
  dimensions: ObjectAvailabilityDimension[];
}

export interface SkylarkGraphQLObjectRelationship {
  nextToken?: string;
  objects: object[]; // TODO make this a Record like SkylarkGraphQLObject
}

export type SkylarkGraphQLObject = {
  __typename: string;
  uid: string;
  external_id: string;
  availability?: SkylarkGraphQLObjectRelationship;
  images?: SkylarkGraphQLObjectRelationship;
} & Record<string, string | number | boolean>;

export type ParsedSkylarkObject = {
  __typename: string;
  uid: string;
  external_id: string;
  availability: ObjectAvailability;
  images?: ObjectImage[];
  relationships: string[];
} & Record<
  string,
  string | string[] | number | boolean | ObjectAvailability | ObjectImage[]
>;
