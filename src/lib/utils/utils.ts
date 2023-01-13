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

export const formatObjectField = (field: string) =>
  field.toUpperCase().replaceAll("_", " ");
