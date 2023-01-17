import { gql } from "@apollo/client";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import {
  SkylarkObjectFields,
  SkylarkObjectMeta,
} from "src/interfaces/skylark/objects";

const common = {
  variables: {
    ignoreAvailability: "Boolean = true",
  },
  args: {
    ignore_availability: new VariableType("ignoreAvailability"),
  },
};

const fieldNamesToNeverAlias = ["uid", "external_id"];

const generateFieldsToReturn = (
  fields: SkylarkObjectMeta["fields"],
  fieldAliasPrefix?: string,
) => {
  const fieldsToReturn = fields.reduce((previous, field) => {
    if (fieldAliasPrefix && !fieldNamesToNeverAlias.includes(field.name)) {
      // It can be beneficial to add an alias to a field when requesting multiple objects in the same request
      // From GraphQL Docs:
      // - If multiple field selections with the same response names are encountered during execution,
      //   the field and arguments to execute and the resulting value should be unambiguous.
      //   Therefore any two field selections which might both be encountered for the same object are only valid if they are equivalent.
      const alias = `${fieldAliasPrefix}${field.name}`;
      return {
        ...previous,
        [alias]: { __aliasFor: field.name },
      };
    }

    return {
      ...previous,
      [field.name]: true,
    };
  }, {});

  return fieldsToReturn;
};

// This is unpleasant but neccessary as Apollo Client doesn't let us pass in any queries that are not valid
// Should be used inconjunction with the Apollo Client option "skip" so the request is not made
export const defaultValidBlankQuery = gql("query { __unknown { name }}");

export const createGetObjectQuery = (object: SkylarkObjectMeta | null) => {
  if (!object || !object.operations.get) {
    return null;
  }

  const query = {
    query: {
      __name: `GET_${object.name}`,
      __variables: {
        ...common.variables,
        uid: "String",
        externalId: "String",
      },
      getObject: {
        __aliasFor: object.operations.get.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
          external_id: new VariableType("externalId"),
        },
        ...generateFieldsToReturn(object.fields),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};

export const createListObjectQuery = (object: SkylarkObjectMeta | null) => {
  if (!object || !object.operations.list) {
    return null;
  }

  const query = {
    query: {
      __name: `LIST_${object.name}`,
      __variables: {
        ...common.variables,
        nextToken: "String",
      },
      listSkylarkObjects: {
        __aliasFor: object.operations.list.name,

        __args: {
          ...common.args,
          limit: 50, // max
          next_token: new VariableType("nextToken"),
        },
        count: true,
        next_token: true,
        objects: {
          ...generateFieldsToReturn(object.fields),
        },
      },
    },
  };
  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};

export const createSearchObjectsQuery = (
  objects: SkylarkObjectFields[],
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

  const query = {
    query: {
      __name: `SEARCH`,
      __variables: {
        ...common.variables,
        queryString: "String!",
      },
      search: {
        __args: {
          ...common.args,
          query: new VariableType("queryString"),
          limit: 1000,
        },
        __typename: true,
        objects: {
          __on: objectsToRequest.map(({ name, fields }) => ({
            __typeName: name,
            __typename: true, // To remove the alias later
            ...generateFieldsToReturn(fields, `__${name}__`),
          })),
        },
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};
