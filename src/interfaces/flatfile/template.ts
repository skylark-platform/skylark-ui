export type FlatfileTemplatePropertyTypes = "string" | "number" | "boolean";

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
    pattern: string;
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

export interface FlatfileTemplatePropertyEmail
  extends FlatfileTemplatePropertyValue {
  type: "string";
  format: "email";
}

export interface FlatfileTemplatePropertyPhone
  extends FlatfileTemplatePropertyValue {
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
