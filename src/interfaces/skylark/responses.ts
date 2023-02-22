import {
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectContent,
} from "./gqlObjects";

// TODO extend to be the full error structure
export interface GQLSkylarkResponseError {
  message: string;
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
