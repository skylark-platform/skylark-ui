import { SkylarkObjectMetadataField } from "./objectOperations";
import { SkylarkExternalId, SkylarkUID } from "./parsedObjects";

export type NextToken = string | null;

export interface SkylarkGraphQLObjectConfig {
  colour: string;
  primary_field: string;
}

export interface SkylarkGraphQLObjectMeta {
  available_languages: string[];
  language_data: {
    language: string;
    version: number;
  };
  global_data: {
    version: number;
  };
}

export interface SkylarkGraphQLAvailabilityDimensionValue {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  slug: string;
  title: string | null;
  description: string | null;
}

export interface SkylarkGraphQLAvailabilityDimension {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  slug: string;
  title: string | null;
  description: string | null;
  values: {
    next_token: NextToken;
    objects: SkylarkGraphQLAvailabilityDimensionValue[];
  };
}

export interface SkylarkGraphQLAvailability {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  slug: string | null;
  title: string | null;
  start: string | null;
  end: string | null;
  timezone: string | null;
  dimensions: {
    next_token: NextToken;
    objects: SkylarkGraphQLAvailabilityDimension[];
  };
}

export interface SkylarkGraphQLObjectRelationship {
  nextToken?: NextToken;
  objects: object[]; // TODO make this a Record like SkylarkGraphQLObject
}

export interface SkylarkGraphQLObjectImage {
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  title: string;
  url: string;
  slug: string;
  type: string;
  description: string;
  content_type: string;
}

export interface SkylarkGraphQLObjectContent {
  objects: {
    object: SkylarkGraphQLObject;
    position: number;
  }[];
}

export type SkylarkGraphQLObject = {
  __typename: string;
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  availability?: SkylarkGraphQLObjectRelationship;
  images?: SkylarkGraphQLObjectRelationship;
  _config?: SkylarkGraphQLObjectConfig;
  _meta?: SkylarkGraphQLObjectMeta;
  content?: SkylarkGraphQLObjectContent;
  [key: string]:
    | SkylarkObjectMetadataField
    | SkylarkGraphQLObjectRelationship
    | SkylarkGraphQLObjectConfig
    | SkylarkGraphQLObjectMeta
    | undefined;
};
