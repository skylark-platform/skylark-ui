import { SkylarkGraphQLObject } from "./gqlObjects";

export interface GQLSkylarkGetObjectResponse {
  getObject: SkylarkGraphQLObject;
}

export interface GQLSkylarkSearchResponse {
  search: {
    objects: (SkylarkGraphQLObject | null)[];
  };
}
