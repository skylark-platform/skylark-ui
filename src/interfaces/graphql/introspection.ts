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

export interface GQLSkylarkObjectTypesResponse {
  __type: {
    name: "Metadata";
    possibleTypes: {
      name: string;
    }[];
  };
}
