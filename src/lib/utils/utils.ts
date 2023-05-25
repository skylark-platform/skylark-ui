import { HTMLInputTypeAttribute } from "react";
import { sentenceCase } from "sentence-case";

import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import {
  NormalizedObjectFieldType,
  ParsedSkylarkObject,
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

export const getObjectTypeDisplayNameFromParsedObject = (
  object: ParsedSkylarkObject | null,
): string => {
  if (!object) return "";
  return object?.config?.objectTypeDisplayName || object.objectType;
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

const isArraysEqual = (arr1: unknown[], arr2: unknown[]) =>
  arr1.length == arr2.length &&
  arr1.every((element, index) => element === arr2[index]);

export const isObjectsDeepEqual = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
): boolean => {
  const objKeys1 = Object.keys(obj1);

  if (objKeys1.length !== Object.keys(obj2).length) {
    return false;
  }

  for (const key of objKeys1) {
    const value1 = obj1[key];
    const value2 = obj2[key];

    const isObjects = isObject(value1) && isObject(value2);
    if (isObjects) {
      return !isObjectsDeepEqual(value1, value2);
    }

    const isArrays = Array.isArray(value1) && Array.isArray(value2);
    if (isArrays) {
      return isArraysEqual(value1, value2);
    }

    if (value1 !== value2) {
      return false;
    }
  }
  return true;
};
