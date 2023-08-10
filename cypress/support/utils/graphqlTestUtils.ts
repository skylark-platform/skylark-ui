// https://docs.cypress.io/guides/end-to-end-testing/working-with-graphql
import { CyHttpMessages } from "cypress/types/net-stubbing";

const isObject = (input: unknown): input is Record<string, unknown> => {
  return typeof input === "object" && input !== null && !Array.isArray(input);
};

const isArraysDeepEqual = (arr1: unknown[], arr2: unknown[]) =>
  arr1.length == arr2.length &&
  arr1.every((el1, index) => {
    const el2 = arr2[index];
    const isObjects = isObject(el1) && isObject(el2);
    if (isObjects) {
      return isObjectsDeepEqual(el1, el2);
    }

    return el1 === el2;
  });

const isObjectsDeepEqual = (
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

// Utility to get the GraphQL Operation name from the request if it exists
export const getOperationName = (
  req: CyHttpMessages.IncomingHttpRequest,
): string | null => {
  const { body } = req;
  return (body.hasOwnProperty("operationName") && body.operationName) || null;
};

// Utility to match GraphQL query/mutation based on the operation name
export const hasOperationName = (
  req: CyHttpMessages.IncomingHttpRequest,
  operationName: string,
) => {
  const requestOperationName = getOperationName(req);
  return requestOperationName && requestOperationName === operationName;
};

// Utility to match GraphQL query/mutation based on the operation name
export const operationNameStartsWith = (
  req: CyHttpMessages.IncomingHttpRequest,
  prefix: string,
) => {
  const requestOperationName = getOperationName(req);
  return requestOperationName && requestOperationName.startsWith(prefix);
};

// Utility to check GraphQL query/mutation has a given variable that matches a value
export const hasMatchingQuery = (
  req: CyHttpMessages.IncomingHttpRequest,
  query: string,
) => {
  const { body } = req;

  return body.hasOwnProperty("query") && body.query === query;
};

// Utility to check GraphQL query/mutation has a given variable
export const hasVariable = (
  req: CyHttpMessages.IncomingHttpRequest,
  variableName: string,
) => {
  const { body } = req;

  return (
    body.hasOwnProperty("variables") &&
    body.variables.hasOwnProperty(variableName)
  );
};

// Utility to check GraphQL query/mutation has a given variable that matches a value
export const hasMatchingVariable = (
  req: CyHttpMessages.IncomingHttpRequest,
  variableName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variableValue: any,
) => {
  if (!hasVariable(req, variableName)) {
    return false;
  }

  const { body } = req;
  const bodyVariableValue = body.variables[variableName];

  if (Array.isArray(variableValue)) {
    return isArraysDeepEqual(bodyVariableValue, variableValue);
  }

  if (isObject(variableValue)) {
    return isObjectsDeepEqual(bodyVariableValue, variableValue);
  }

  return bodyVariableValue === variableValue;
};

// Alias query if operationName matches
export const aliasQuery = (
  req: CyHttpMessages.IncomingHttpRequest,
  operationName: string,
) => {
  if (hasOperationName(req, operationName)) {
    req.alias = `gql${operationName}Query`;
  }
};

// Alias mutation if operationName matches
export const aliasMutation = (
  req: CyHttpMessages.IncomingHttpRequest,
  operationName: string,
) => {
  if (hasOperationName(req, operationName)) {
    req.alias = `gql${operationName}Mutation`;
  }
};
