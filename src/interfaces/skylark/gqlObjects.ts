import {
  BuiltInSkylarkObjectType,
  SkylarkObjectMetadataField,
  SkylarkSystemField,
} from "./objectOperations";
import { SkylarkExternalId, SkylarkUID } from "./parsedObjects";

export type NextToken = string | null;

export type SkylarkObjectConfigFieldType =
  | "STRING"
  | "TEXTAREA"
  | "WYSIWYG"
  | "TIMEZONE"
  | null;

export interface SkylarkGraphQLObjectConfig {
  colour: string;
  primary_field: string;
  display_name: string;
  field_config?: {
    name: string;
    ui_field_type: SkylarkObjectConfigFieldType;
    ui_position: number;
  }[];
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
  modified?: {
    date?: string;
  };
  created?: {
    date?: string;
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
}

export interface SkylarkGraphQLAvailabilityDimensionWithValues
  extends SkylarkGraphQLAvailabilityDimension {
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
    objects: SkylarkGraphQLAvailabilityDimensionWithValues[];
  };
}

export interface SkylarkGraphQLObjectRelationship {
  __typename: string;
  next_token?: NextToken;
  objects: object[]; // TODO make this a Record like SkylarkGraphQLObject
}

export interface SkylarkGraphQLObjectImage {
  _meta?: SkylarkGraphQLObjectMeta;
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
  next_token?: NextToken;
  objects: {
    object: SkylarkGraphQLObject;
    position: number;
  }[];
}

export type SkylarkGraphQLObject = {
  __typename: string;
  [SkylarkSystemField.UID]: SkylarkUID;
  [SkylarkSystemField.ExternalID]: SkylarkExternalId;
  [SkylarkSystemField.Slug]?: string | null;
  [SkylarkSystemField.DataSourceID]?: string | null;
  [SkylarkSystemField.DataSourceFields]?: string | string[] | null;
  availability?: SkylarkGraphQLObjectRelationship;
  images?: SkylarkGraphQLObjectRelationship;
  _config?: SkylarkGraphQLObjectConfig;
  _meta?: SkylarkGraphQLObjectMeta;
  content?: SkylarkGraphQLObjectContent;
  [key: string]:
    | SkylarkObjectMetadataField
    | SkylarkGraphQLObjectRelationship
    | SkylarkGraphQLObjectContent
    | SkylarkGraphQLObjectConfig
    | SkylarkGraphQLObjectMeta
    | undefined;
};
