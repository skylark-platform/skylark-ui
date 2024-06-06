import gql from "graphql-tag";
import { VariableType } from "json-to-graphql-query";

import { SkylarkObjectMeta } from "src/interfaces/skylark";

import {
  generateVariablesAndArgs,
  generateFieldsToReturn,
  generateRelationshipsToReturn,
  wrappedJsonQuery,
} from "./utils";

export const createGetObjectGenericQuery = (
  objects: SkylarkObjectMeta[] | null,
  {
    typesToRequest,
  }: {
    typesToRequest: string[];
  },
  ignoreLanguage?: boolean,
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

  const { args, variables } = generateVariablesAndArgs(
    "genericGetObject",
    "Query",
    !ignoreLanguage,
  );

  const query = {
    query: {
      __name: "GET_OBJECT_GENERIC",
      __variables: {
        ...variables,
        uid: "String",
        externalId: "String",
      },
      getObject: {
        __aliasFor: "getObject",
        __args: {
          ...args,
          uid: new VariableType("uid"),
          external_id: new VariableType("externalId"),
        },
        __typename: true,
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
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
