import { SkylarkObjectType } from "src/interfaces/skylark/objects";

type GQLBuiltInScalars = "Int" | "Float" | "String" | "Boolean" | "ID";
type GQLAdditionalScalars =
  | "AWSDate"
  | "AWSDateTime"
  | "AWSEmail"
  | "AWSIPAddress"
  | "AWSJSON"
  | "AWSPhone"
  | "AWSTime"
  | "AWSTimestamp"
  | "AWSURL";

export type GQLScalars = GQLBuiltInScalars | GQLAdditionalScalars;

export type GQLTypeName = GQLScalars | string;
export type GQLTypeKind =
  | "SCALAR"
  | "LIST"
  | "NON_NULL"
  | "ENUM"
  | "INPUT_OBJECT"
  | "OBJECT";

export interface GQLType {
  __typename: string;
  kind: GQLTypeKind | null;
  name: GQLTypeName | null;
  enumValues: { name: string }[] | null;
  fields: GQLInputField[];
  inputFields: GQLInputField[];
  ofType: Pick<GQLType, "name" | "kind"> | null;
}

export interface GQLInputValue {
  name: string;
  type: Pick<GQLType, "name" | "kind" | "inputFields">;
}

export interface GQLInputField {
  name: string;
  type: GQLType;
}

export interface GQLQueryList {
  name: string;
  type: {
    name: string;
    kind: GQLTypeKind | null;
    description: string | null;
    fields: { name: string }[] | null;
    ofType: string;
  };
}
[];

export interface GQLMutationsList {
  name: string;
  args: GQLInputValue[];
  type: {
    name: string;
    kind: GQLTypeKind | null;
    description: string | null;
    fields: { name: string }[] | null;
    ofType: string;
  };
}
[];

export interface GQLSkylarkObjectTypesResponse {
  __type: { enumValues: { name: SkylarkObjectType }[] };
}

export interface GQLSkylarkSchemaQueriesMutations {
  __schema: {
    queryType: {
      name: "Query";
      fields: {
        name: string; // "getEpisode"
        type: {
          name: string; // Episode
          fields: {
            name: string; // assets OR title
            type: GQLType;
          }[];
        };
      }[];
    };
    mutationType: {
      name: "Mutation";
      fields: {
        name: string;
        args: {
          name: string;
          type: GQLType;
        }[];
      }[];
    };
  };
}

export interface GQLSkylarkSearchableObjectsUnionResponse {
  __type: {
    name: "Searchable";
    possibleTypes: {
      name: string;
    }[];
  };
}
