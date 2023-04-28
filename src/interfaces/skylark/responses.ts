import {
  NextToken,
  SkylarkGraphQLAvailability,
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
    content: SkylarkGraphQLObjectContent;
  };
}

export interface GQLSkylarkUpdateRelationshipsResponse {
  updateRelationships: {
    uid: string;
  };
}
export type GQLSkylarkObjectTypesWithConfig = Record<
  SkylarkObjectType,
  SkylarkGraphQLObjectConfig
>;
