import { HTMLInputTypeAttribute } from "react";
import { sentenceCase } from "sentence-case";

import {
  DISPLAY_NAME_PRIORITY,
  OBJECT_LIST_TABLE,
  SYSTEM_FIELDS,
} from "src/constants/skylark";
import {
  NormalizedObjectFieldType,
  ParsedSkylarkObject,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";

export const hasProperty = <T, K extends PropertyKey>(
  object: T,
  property: K,
): object is T & Record<K, unknown> => {
  return Object.prototype.hasOwnProperty.call(object, property);
};

export const isObject = (input: unknown): input is Record<string, unknown> => {
  return typeof input === "object" && input !== null && !Array.isArray(input);
};

export const pause = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatObjectField = (field?: string) =>
  field
    ? field === "uid"
      ? "UID"
      : sentenceCase(field?.replaceAll("_", " "))
    : "";

export const getPrimaryKeyField = (object: ParsedSkylarkObject) =>
  [object?.config?.primaryField || "", ...DISPLAY_NAME_PRIORITY].find(
    (field) => !!object.metadata[field],
  );

export const getObjectDisplayName = (
  object: ParsedSkylarkObject | null,
): string => {
  if (!object) return "";
  const primaryKeyField = getPrimaryKeyField(object);
  const displayName = primaryKeyField && object.metadata[primaryKeyField];
  return (displayName as string) || object.uid;
};

// Creates an Account Identifier (used in Flatfile template)
// Will change when we have proper auth / teams / accounts
export const createAccountIdentifier = (uri: string) => {
  const url = new URL(uri as string);
  const { hostname } = url;
  return hostname
    .replaceAll(".", "-")
    .replaceAll("_", "-")
    .replaceAll(" ", "-");
};

export const convertFieldTypeToHTMLInputType = (
  objectFieldType: NormalizedObjectFieldType,
): HTMLInputTypeAttribute => {
  switch (objectFieldType) {
    case "datetime":
    case "timestamp":
      return "datetime-local";
    case "time":
      return "time";
    case "date":
      return "date";
    case "email":
      return "email";
    case "phone":
      return "tel";
    case "float":
    case "int":
      return "number";
    case "url":
      return "url";
    default:
      return "text";
  }
};
