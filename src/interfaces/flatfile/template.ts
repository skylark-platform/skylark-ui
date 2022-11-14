export type FlatfileTemplatePropertyTypes =
  | "string"
  | "number"
  | "boolean"
  | "enum";

interface FlatfileTemplatePropertyValue {
  type: FlatfileTemplatePropertyTypes;
  label: string;
  default?: string;
  description?: string;
}

export interface FlatfileTemplatePropertyString
  extends FlatfileTemplatePropertyValue {
  type: "string";
  regexp?: {
    pattern: "regex";
    flags: string;
    ignoreBlanks: boolean;
  };
}

export interface FlatfileTemplatePropertyNumber
  extends FlatfileTemplatePropertyValue {
  type: "number";
  minimum: number;
  maxiumum: number;
}

export interface FlatfileTemplatePropertyBoolean
  extends FlatfileTemplatePropertyValue {
  type: "boolean";
  default?: "true" | "false";
}

export interface FlatfileTemplatePropertyEnum
  extends FlatfileTemplatePropertyValue {
  type: "string";
  enum: string[];
  enumLabel: string[];
}

interface FlatfileTemplatePropertyEmail extends FlatfileTemplatePropertyValue {
  type: "string";
  format: "email";
}

interface FlatfileTemplatePropertyPhone extends FlatfileTemplatePropertyValue {
  type: "string";
  format: "phone";
}

export type FlatfileTemplatePropertyType =
  | FlatfileTemplatePropertyString
  | FlatfileTemplatePropertyNumber
  | FlatfileTemplatePropertyBoolean
  | FlatfileTemplatePropertyEnum
  | FlatfileTemplatePropertyEmail
  | FlatfileTemplatePropertyPhone;

export interface FlatfileTemplateProperties {
  [key: string]: FlatfileTemplatePropertyType;
}

export interface FlatfileTemplate {
  type: "object";
  properties: FlatfileTemplateProperties;
  required: string[];
  unique: string[];
}
