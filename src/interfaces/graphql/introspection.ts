import { SkylarkObjectTypes } from "src/interfaces/skylark/objects";

export type GQLKind = "SCALAR" | "LIST" | "NON_NULL" | "ENUM" | "INPUT_OBJECT";

export interface GQLType {
  kind: GQLKind | null;
  name: string;
  description: string | null;
  enumValues: { name: string }[] | null;
  inputFields: GQLInputField[];
  ofType: Pick<GQLType, "name" | "kind"> | null;
}

export interface GQLInputValue {
  name: string;
  description: string;
  type: Pick<GQLType, "name" | "kind" | "inputFields" | "description">;
  defaultValue: string;
}

export interface GQLInputField {
  name: string;
  type: Pick<
    GQLType,
    "name" | "kind" | "enumValues" | "description" | "ofType"
  >;
}

export interface GQLMutationsList {
  name: string;
  args: GQLInputValue[];
  type: {
    name: string;
    kind: GQLKind | null;
    description: string | null;
    fields: { name: string }[] | null;
    ofType: string;
  };
}
[];

export interface SkylarkGetInputFieldsResponse {
  __type: {
    inputFields: GQLInputField[];
  };
}

export interface GQLSkylarkObjectTypesResponse {
  __type: { enumValues: SkylarkObjectTypes };
}
