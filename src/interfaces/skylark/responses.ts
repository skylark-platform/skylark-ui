import {
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectContent,
} from "./gqlObjects";

// TODO extend to be the full error structure
export interface GQLSkylarkResponseError<T> {
  response: {
    data: T | null;
    errors: {
      data: T | null;
      errorInfo: null;
      errorType: string;
      message: string;
      path: string[];
    }[];
  };
}

export interface GQLSkylarkGetObjectResponse {
  getObject: SkylarkGraphQLObject;
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
