import {
  NextToken,
  SkylarkGraphQLAvailability,
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLAvailabilityDimensionValue,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectConfig,
  SkylarkGraphQLObjectContent,
} from "./gqlObjects";
import { SkylarkObjectType } from "./objectOperations";

export interface GQLSkylarkError<T> {
  data: T | null;
  errorInfo: null;
  errorType: string;
  message: string;
  path: string[];
}

export interface GQLSkylarkErrorResponse<T> {
  response: {
    data: T | null;
    errors: GQLSkylarkError<T>[];
  };
}

export interface GQLSkylarkGetObjectResponse {
  getObject: SkylarkGraphQLObject;
}

export interface GQLSkylarkGetObjectRelationshipsResponse {
  getObjectRelationships: SkylarkGraphQLObject;
}

export interface GQLSkylarkGetObjectContentResponse {
  getObjectContent: {
    content: SkylarkGraphQLObjectContent;
  };
}

export interface GQLSkylarkGetObjectAvailabilityResponse {
  getObjectAvailability: {
    availability: {
      next_token: NextToken;
      objects: SkylarkGraphQLAvailability[];
    };
  };
}

export interface GQLSkylarkSearchResponse {
  search: {
    total_count?: number;
    objects: (SkylarkGraphQLObject | null)[];
  };
}

export interface GQLSkylarkCreateObjectMetadataResponse {
  createObject: SkylarkGraphQLObject;
}

export interface GQLSkylarkUpdateObjectMetadataResponse {
  updateObjectMetadata: SkylarkGraphQLObject;
}

export interface GQLSkylarkUpdateObjectContentResponse {
  updateObjectContent: {
    uid: string;
  };
}

export interface GQLSkylarkUpdateRelationshipsResponse {
  updateObjectRelationships: SkylarkGraphQLObject;
}
export type GQLSkylarkObjectTypesWithConfig = Record<
  SkylarkObjectType,
  SkylarkGraphQLObjectConfig
>;

export interface GQLSkylarkListAvailabilityDimensionsResponse {
  listDimensions: {
    next_token: NextToken;
    objects: SkylarkGraphQLAvailabilityDimension[];
  };
}

export type GQLSkylarkListAvailabilityDimensionValuesResponse = Record<
  string,
  {
    uid: string;
    values: {
      next_token: NextToken;
      objects: SkylarkGraphQLAvailabilityDimensionValue[];
    };
  }
>;

export interface GQLSkylarkGetAvailabilityDimensions {
  getAvailability: SkylarkGraphQLAvailability;
}
