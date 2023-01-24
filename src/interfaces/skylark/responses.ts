import {
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectRelationship,
} from "./gqlObjects";
import { SkylarkObjectMetadataField } from "./objectOperations";

export interface GQLSkylarkGetObjectResponse {
  getObject: { __typename: string; uid: string; external_id: string } & Record<
    string,
    SkylarkObjectMetadataField | SkylarkGraphQLObjectRelationship
  >;
}

export interface GQLSkylarkSearchResponse {
  search: {
    objects: (SkylarkGraphQLObject | null)[];
  };
}
