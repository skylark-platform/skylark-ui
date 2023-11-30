import gql from "graphql-tag";
import { VariableType, jsonToGraphQLQuery } from "json-to-graphql-query";

import { SkylarkObjectMeta } from "src/interfaces/skylark";

import {
  generateVariablesAndArgs,
  generateFieldsToReturn,
  generateRelationshipsToReturn,
} from "./utils";

export const createSearchObjectsQuery = (
  objects: SkylarkObjectMeta[] | null,
  {
    typesToRequest,
  }: {
    typesToRequest: string[];
  },
) => {
  // Default to showing all objects when no types are requested
  const objectsToRequest =
    typesToRequest.length > 0
      ? objects?.filter(({ name }) => typesToRequest.includes(name))
      : objects;

  if (
    !objects ||
    objects.length === 0 ||
    !objectsToRequest ||
    objectsToRequest.length === 0
  ) {
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
        dimensions: "[UserDimension]",
      },
      search: {
        __args: {
          ...args,
          query: new VariableType("queryString"),
          offset: new VariableType("offset"),
          limit: new VariableType("limit"),
          dimensions: new VariableType("dimensions"),
        },
        __typename: true,
        total_count: true,
        objects: {
          uid: true,
          __on: objectsToRequest.map((object) => {
            const common = generateVariablesAndArgs(object.name, "Query");
            return {
              __typeName: object.name,
              __typename: true, // To remove the alias later
              ...generateFieldsToReturn(
                object.fields,
                object.name,
                true,
                `__${object.name}__`,
              ),
              ...generateRelationshipsToReturn(object, true),
              ...common.fields,
            };
          }),
        },
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};
