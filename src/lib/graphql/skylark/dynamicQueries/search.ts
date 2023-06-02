import gql from "graphql-tag";
import { VariableType, jsonToGraphQLQuery } from "json-to-graphql-query";

import { SkylarkObjectMeta } from "src/interfaces/skylark";

import {
  generateVariablesAndArgs,
  generateFieldsToReturn,
  generateRelationshipsToReturn,
} from "./utils";

export const createSearchObjectsQuery = (
  objects: SkylarkObjectMeta[],
  typesToRequest: string[],
) => {
  // Default to showing all objects when no types are requested
  const objectsToRequest =
    typesToRequest.length > 0
      ? objects.filter(({ name }) => typesToRequest.includes(name))
      : objects;

  if (!objects || objects.length === 0 || objectsToRequest.length === 0) {
    return null;
  }

  const { args, variables } = generateVariablesAndArgs("search", "Query", true);

  const query = {
    query: {
      __name: "SEARCH",
      __variables: {
        ...variables,
        queryString: "String!",
        offset: "Int",
        limit: "Int",
      },
      search: {
        __args: {
          ...args,
          query: new VariableType("queryString"),
          offset: new VariableType("offset"),
          limit: new VariableType("limit"),
        },
        __typename: true,
        total_count: true,
        objects: {
          __on: objectsToRequest.map((object) => {
            const common = generateVariablesAndArgs(object.name, "Query");
            return {
              __typeName: object.name,
              __typename: true, // To remove the alias later
              ...common.fields,
              ...generateFieldsToReturn(
                object.fields,
                object.name,
                `__${object.name}__`,
              ),
              ...generateRelationshipsToReturn(object, true),
            };
          }),
        },
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};
