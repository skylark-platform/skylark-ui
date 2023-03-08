// https://docs.cypress.io/guides/end-to-end-testing/working-with-graphql
import { CyHttpMessages } from "cypress/types/net-stubbing";

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
  const { body } = req;

  return (
    hasVariable(req, variableName) &&
    body.variables[variableName] === variableValue
  );
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
