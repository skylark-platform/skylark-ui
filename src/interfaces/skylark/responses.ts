import {
  SkylarkGraphQLAvailability,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectContent,
} from "./gqlObjects";

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

export interface GQLSkylarkGetObjectAvailabilityResponse {
  getObjectAvailability: {
    availability: {
      next_token: string | null;
      objects: SkylarkGraphQLAvailability[];
    };
  };
}

export interface GQLSkylarkSearchResponse {
  search: {
    objects: (SkylarkGraphQLObject | null)[];
  };
}

export interface GQLSkylarkUpdateObjectContentResponse {
  updateObjectContent: {
    content: SkylarkGraphQLObjectContent;
  };
}
