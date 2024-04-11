import { HTMLInputTypeAttribute, MouseEvent } from "react";

import {
  CLOUDINARY_ENVIRONMENT,
  DISPLAY_NAME_PRIORITY,
} from "src/constants/skylark";
import {
  BuiltInSkylarkObjectType,
  NormalizedObjectFieldType,
  ParsedSkylarkObject,
  ParsedSkylarkObjectConfig,
} from "src/interfaces/skylark";

export const hasProperty = <T, K extends PropertyKey, V = unknown>(
  object: T,
  property: K,
): object is T & Record<K, V> => {
  return Object.prototype.hasOwnProperty.call(object, property);
};

export const isObject = (input: unknown): input is Record<string, unknown> => {
  return typeof input === "object" && input !== null && !Array.isArray(input);
};

export const pause = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getPrimaryKeyField = (
  object: ParsedSkylarkObject,
  fallbackConfig?: Record<string, ParsedSkylarkObjectConfig>,
) =>
  [
    object?.config?.primaryField ||
      fallbackConfig?.[object.objectType]?.primaryField ||
      "",
    ...DISPLAY_NAME_PRIORITY,
  ].find((field) => !!object.metadata[field]);

export const getObjectDisplayName = (
  object: ParsedSkylarkObject | null,
  fallbackConfig?: Record<string, ParsedSkylarkObjectConfig>,
): string => {
  if (!object) return "";
  const primaryKeyField = getPrimaryKeyField(object, fallbackConfig);
  const displayName = primaryKeyField && object.metadata[primaryKeyField];
  return (displayName as string) || object.uid;
};

export const getObjectTypeDisplayNameFromParsedObject = (
  object: ParsedSkylarkObject | null,
  fallbackConfig?: Record<string, ParsedSkylarkObjectConfig>,
): string => {
  if (!object) return "";
  return (
    object?.config?.objectTypeDisplayName ||
    fallbackConfig?.[object.objectType]?.objectTypeDisplayName ||
    object.objectType
  );
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

export const isArraysDeepEqual = (arr1: unknown[], arr2: unknown[]) =>
  arr1.length == arr2.length &&
  arr1.every((el1, index) => {
    const el2 = arr2[index];
    const isObjects = isObject(el1) && isObject(el2);
    if (isObjects) {
      return isObjectsDeepEqual(el1, el2);
    }

    return el1 === el2;
  });

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
      return isArraysDeepEqual(value1, value2);
    }

    if (value1 !== value2) {
      return false;
    }
  }
  return true;
};

export const getJSONFromLocalStorage = <T>(key: string) => {
  const str = localStorage.getItem(key);
  if (!str) {
    return null;
  }

  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
};

export const readIntFromLocalStorage = (name: string): number => {
  const valueFromStorage = localStorage.getItem(name);

  if (!valueFromStorage) {
    return 0;
  }

  try {
    const int = parseInt(valueFromStorage);
    return Number.isNaN(int) ? 0 : int;
  } catch (err) {
    return 0;
  }
};

export const addCloudinaryOnTheFlyImageTransformation = (
  imageUrl: string,
  opts: { height?: number; width?: number },
) => {
  // If the Cloudinary Environment is falsy, return the original image URL
  if (!imageUrl || !CLOUDINARY_ENVIRONMENT) {
    return imageUrl;
  }

  const urlOpts = [];
  if (opts.height) {
    urlOpts.push(`h_${opts.height}`);
  }
  if (opts.width) {
    urlOpts.push(`w_${opts.width}`);
  }

  if (opts.height && opts.width) {
    urlOpts.push("c_fill");
  }

  const urlOptsStr = urlOpts.length > 0 ? `${urlOpts.join(",")}/` : "";

  const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_ENVIRONMENT}/image/fetch/${urlOptsStr}${imageUrl}`;
  return cloudinaryUrl;
};

export const skylarkObjectsAreSame = (
  obj1: ParsedSkylarkObject,
  obj2: ParsedSkylarkObject,
) =>
  obj1.uid === obj2.uid &&
  obj1.objectType === obj2.objectType &&
  obj1.meta.language === obj2.meta.language;

export const skylarkObjectIsInArray = (
  objToFind: ParsedSkylarkObject,
  arr: ParsedSkylarkObject[],
) => arr.findIndex((obj) => skylarkObjectsAreSame(objToFind, obj)) > -1;

// Naive implementation, just removes Listing from ImageListing
export const getObjectTypeFromListingTypeName = (typename: string) =>
  typename.substring(0, typename.lastIndexOf("Listing"));

export const shallowCompareObjects = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every((key) => obj1[key] === obj2[key]);

// https://github.com/gregberge/react-merge-refs/blob/93bec3a1bf57c58a952c9f9b27ac81b64d9c2ee3/src/index.tsx
export function mergeRefs<T = unknown>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>,
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export const userIsOnMac = () =>
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export const platformMetaKeyClicked = (
  e: KeyboardEvent | MouseEvent<unknown, unknown>,
) => {
  const isMac = userIsOnMac();
  return isMac ? e.metaKey : e.ctrlKey;
};

export const isSkylarkObjectType = (objectType: string) =>
  objectType === BuiltInSkylarkObjectType.Availability ||
  objectType.toUpperCase().startsWith("SKYLARK");

export const insertAtIndex = <T>(
  array: T[],
  index: number,
  item: T | T[],
): T[] => {
  const itemArr: T[] = Array.isArray(item) ? item : [item];
  return [...array.slice(0, index), ...itemArr, ...array.slice(index)];
};

export const chunkArray = <T>(arr: T[], chunkSize: number) => {
  const chunkedArray: T[][] = [];

  for (let index = 0; index < arr.length; index += chunkSize) {
    chunkedArray.push(arr.slice(index, index + chunkSize));
  }

  return chunkedArray;
};
