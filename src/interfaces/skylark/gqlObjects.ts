import { EnumType } from "json-to-graphql-query";

import {
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
  | "COLOURPICKER"
  | null;

export interface SkylarkGraphQLObjectConfig {
  colour: string | null;
  primary_field: string | null;
  display_name: string | null;
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
  published?: boolean;
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
  __typename: string;
  uid: SkylarkUID;
  external_id: SkylarkExternalId;
  slug: string | null;
  title: string | null;
  start: string | null;
  end: string | null;
  timezone: string | null;
  active: boolean | null;
  inherited: boolean | null;
  inheritance_source: boolean | null;
  inherited_by?: SkylarkGraphQLObjectList;
  inherited_from?: SkylarkGraphQLObjectList;
  dimensions?: {
    next_token: NextToken;
    objects: SkylarkGraphQLAvailabilityDimensionWithValues[];
  };
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
    dynamic: boolean;
  }[];
}

export type SkylarkGraphQLObject = {
  __typename: string;
  [SkylarkSystemField.UID]: SkylarkUID;
  [SkylarkSystemField.ExternalID]: SkylarkExternalId;
  [SkylarkSystemField.Slug]?: string | null;
  [SkylarkSystemField.DataSourceID]?: string | null;
  [SkylarkSystemField.DataSourceFields]?: string | string[] | null;
  availability?: SkylarkGraphQLAvailabilityList;
  _config?: SkylarkGraphQLObjectConfig;
  _meta?: SkylarkGraphQLObjectMeta;
  content?: SkylarkGraphQLObjectContent;
  dynamic_content?: SkylarkGraphQLDynamicContentConfiguration;
  [key: string]:
    | SkylarkObjectMetadataField
    | SkylarkGraphQLObjectList<SkylarkGraphQLObject>
    | SkylarkGraphQLAvailabilityList
    | SkylarkGraphQLObjectContent
    | SkylarkGraphQLObjectConfig
    | SkylarkGraphQLObjectMeta
    | SkylarkGraphQLDynamicContentConfiguration
    | undefined;
};

export interface SkylarkGraphQLAvailabilityAssignedTo {
  next_token?: NextToken;
  objects: {
    inherited: SkylarkGraphQLAvailability["inherited"];
    inheritance_source: SkylarkGraphQLAvailability["inheritance_source"];
    active: SkylarkGraphQLAvailability["active"];
    object: SkylarkGraphQLObject;
  }[];
}
export type SkylarkGraphQLObjectList<T = SkylarkGraphQLObject> = {
  __typename: string;
  next_token: NextToken;
  objects: T[];
};

export type SkylarkGraphQLAvailabilityList =
  SkylarkGraphQLObjectList<SkylarkGraphQLAvailability> & {
    time_window_status: "EXPIRED" | "FUTURE" | "ACTIVE" | "UNAVAILABLE" | null;
  };

export interface SkylarkGraphQLAPIKey {
  name: string;
  active: boolean;
  api_key: string | null;
  expires: string | null;
  permissions: string[];
  created: string;
}

export interface SkylarkGraphQLDynamicContentConfigurationRuleBlock {
  object_types: string[];
  relationship_name: string;
  uid: string[] | null;
}

export interface SkylarkGraphQLDynamicContentConfiguration {
  dynamic_content_types: string[] | null;
  dynamic_content_rules:
    | [
        Pick<
          SkylarkGraphQLDynamicContentConfigurationRuleBlock,
          "object_types"
        > & {
          relationship_name: null;
          uid: null;
        },
        ...Array<SkylarkGraphQLDynamicContentConfigurationRuleBlock>,
      ][]
    | null;
}

export type SkylarkGraphQLDynamicSetRuleBlockInput = Omit<
  SkylarkGraphQLDynamicContentConfigurationRuleBlock,
  "object_types"
> & {
  object_types: EnumType[];
};

export interface SkylarkDynamicSetInput {
  dynamic_content_types: EnumType[];
  dynamic_content_rules: [
    { object_types: EnumType[] },
    ...Array<SkylarkGraphQLDynamicSetRuleBlockInput>,
  ][];
  limit?: number;
}
