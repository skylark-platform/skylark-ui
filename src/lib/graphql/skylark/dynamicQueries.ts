import { gql } from "@apollo/client";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import {
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark/objects";

const common = {
  variables: {
    ignoreAvailability: "Boolean = true",
  },
  args: {
    ignore_availability: new VariableType("ignoreAvailability"),
  },
};

const generateFieldsToReturn = (fields: SkylarkObjectMeta["fields"]) => {
  const fieldsToReturn = fields.reduce((previous, field) => {
    return {
      ...previous,
      [field.name]: true,
    };
  }, {});

  return fieldsToReturn;
};

export const createGetObjectQuery = (object: SkylarkObjectMeta | null) => {
  if (!object || !object.operations.get) {
    return null;
  }

  const query = {
    query: {
      __variables: {
        ...common.variables,
        uid: "String",
        externalId: "String",
      },
      [object.operations.get.name]: {
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
