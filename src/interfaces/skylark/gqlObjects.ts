export interface SkylarkGraphQLAvailabilityDimension {
  title: string;
  slug: string;
  values: {
    title: string;
    slug: string;
    description: string;
  }[];
}

export interface SkylarkGraphQLAvailability {
  title: string;
  slug: string;
  start: string;
  end: string;
  dimensions: SkylarkGraphQLAvailabilityDimension[];
}

export interface SkylarkGraphQLObjectRelationship {
  nextToken?: string;
  objects: object[]; // TODO make this a Record like SkylarkGraphQLObject
}

export interface SkylarkGraphQLObjectImage {
  title: string;
  url: string;
  uid: string;
  slug: string;
  type: string;
  external_id: string;
  description: string;
}

export type SkylarkGraphQLObject = {
  __typename: string;
  uid: string;
  external_id: string;
  availability?: SkylarkGraphQLObjectRelationship;
  images?: SkylarkGraphQLObjectRelationship;
} & Record<string, string | number | boolean>;
