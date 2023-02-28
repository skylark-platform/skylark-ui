import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { ParsedSkylarkObjectContentObject } from "src/interfaces/skylark";

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
  field?.toUpperCase().replaceAll("_", " ") || "";

export const getPrimaryKey = (obj: ParsedSkylarkObjectContentObject) =>
  [obj.config.primaryField || "", ...DISPLAY_NAME_PRIORITY].find(
    (field) => !!obj.object[field],
  );

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
