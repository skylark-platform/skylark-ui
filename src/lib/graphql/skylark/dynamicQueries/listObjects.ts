import gql from "graphql-tag";
import { VariableType } from "json-to-graphql-query";

import { SkylarkObjectMeta } from "src/interfaces/skylark";

import {
  generateFieldsToReturn,
  generateVariablesAndArgs,
  wrappedJsonQuery,
} from "./utils";

export const createListAllObjectsQuery = (
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

  const { variables } = generateVariablesAndArgs("listObjects", "Query", true);

  const listObjectQueries = objectsToRequest.reduce((prev, object) => {
    if (!object.operations.list?.name) {
      return prev;
    }

    const { args } = generateVariablesAndArgs(object.name, "Query", true);

    return {
      ...prev,
      [object.name]: {
        __args: {
          ...args,
          limit: 100,
          next_token: new VariableType(`${object.name}NextToken`),
        },
        __aliasFor: object.operations.list.name,
        next_token: true,
        count: true,
        objects: {
          __typename: true, // To remove the alias later
          uid: true,
          ...generateFieldsToReturn(
            object.fields,
            object.name,
            true,
            `__${object.name}__`,
          ),
        },
      },
    };
  }, {});

  const nextTokenVariables = objectsToRequest.reduce(
    (prev, { name }) => ({
      ...prev,
      [`${name}NextToken`]: "String",
    }),
    {},
  );

  const query = {
    query: {
      __name: "LIST_ALL_OBJECTS",
      __variables: {
        ...variables,
        ...nextTokenVariables,
      },
      ...listObjectQueries,
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
