import gql from "graphql-tag";
import { VariableType } from "json-to-graphql-query";

import {
  SkylarkObjectMeta,
  NormalizedObjectField,
} from "src/interfaces/skylark";

import {
  generateVariablesAndArgs,
  generateFieldsToReturn,
  generateRelationshipsToReturn,
  generateContentsToReturn,
  getObjectConfigFields,
  generateAvailabilityRelationshipFields,
  wrappedJsonQuery,
} from "./utils";

export const createGetObjectQueryName = (objectType: string) =>
  `GET_${objectType}`;
export const createGetObjectAvailabilityQueryName = (objectType: string) =>
  `GET_${objectType}_AVAILABILITY`;
export const createGetObjectRelationshipsQueryName = (objectType: string) =>
  `GET_${objectType}_RELATIONSHIPS`;
export const createGetObjectContentQueryName = (objectType: string) =>
  `GET_${objectType}_CONTENT`;
export const createGetObjectContentOfQueryName = (objectType: string) =>
  `GET_${objectType}_CONTENT_OF`;

export const createGetObjectQuery = (
  object: SkylarkObjectMeta | null,
  addLanguageVariable?: boolean,
) => {
  if (!object || !object.operations.get) {
    return null;
  }
  const common = generateVariablesAndArgs(
    object.name,
    "Query",
    addLanguageVariable,
  );

  const query = {
    query: {
      __name: createGetObjectQueryName(object.name),
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
        __typename: true,
        ...common.fields,
        ...getObjectConfigFields(true),
        ...generateFieldsToReturn(object.fields, object.name),
        ...generateRelationshipsToReturn(object),
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetObjectAvailabilityQuery = (
  object: SkylarkObjectMeta | null,
  addLanguageVariable: boolean,
) => {
  if (!object || !object.operations.get) {
    return null;
  }

  const common = generateVariablesAndArgs(
    object.name,
    "Query",
    addLanguageVariable,
  );

  const query = {
    query: {
      __name: createGetObjectAvailabilityQueryName(object.name),
      __variables: {
        ...common.variables,
        uid: "String",
        externalId: "String",
        nextToken: "String",
      },
      getObjectAvailability: {
        __aliasFor: object.operations.get.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
          external_id: new VariableType("externalId"),
        },
        availability: {
          __args: {
            limit: 10,
            next_token: new VariableType("nextToken"),
          },
          next_token: true,
          objects: {
            uid: true,
            external_id: true,
            title: true,
            slug: true,
            start: true,
            end: true,
            timezone: true,
            dimensions: {
              __args: {
                limit: 50,
              },
              next_token: true,
              objects: {
                uid: true,
                title: true,
                slug: true,
                external_id: true,
                description: true,
                values: {
                  objects: {
                    description: true,
                    external_id: true,
                    slug: true,
                    title: true,
                    uid: true,
                  },
                  next_token: true,
                },
              },
            },
          },
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetObjectRelationshipsQuery = (
  object: SkylarkObjectMeta | null,
  relationshipsFields: { [key: string]: NormalizedObjectField[] },
  addLanguageVariable: boolean,
) => {
  if (!object || !object.operations.get) {
    return null;
  }

  const common = generateVariablesAndArgs(
    object.name,
    "Query",
    addLanguageVariable,
  );

  const relationshipNextTokenVariables = object.relationships.reduce(
    (prev, { relationshipName }) => ({
      ...prev,
      [`${relationshipName}NextToken`]: "String",
    }),
    {},
  );

  const query = {
    query: {
      __name: createGetObjectRelationshipsQueryName(object.name),
      __variables: {
        uid: "String",
        ...relationshipNextTokenVariables,
        ...common.variables,
      },
      getObjectRelationships: {
        __aliasFor: object.operations.get.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
        },
        ...object.relationships.reduce((acc, currentValue) => {
          const common = generateVariablesAndArgs(
            currentValue.objectType,
            "Query",
          );
          return {
            ...acc,
            [currentValue.relationshipName]: {
              __args: {
                limit: 100,
                next_token: new VariableType(
                  `${currentValue.relationshipName}NextToken`,
                ),
              },
              __typename: true, // To get the ObjectType (Listing)
              next_token: true,
              objects: {
                uid: true,
                __typename: true,
                ...generateFieldsToReturn(
                  relationshipsFields[currentValue.objectType],
                  currentValue.objectType,
                ),
                ...(object.availability
                  ? {
                      availability: generateAvailabilityRelationshipFields(
                        object.availability,
                      ),
                    }
                  : {}),
                ...common.fields,
              },
            },
          };
        }, {}),
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetObjectContentQuery = (
  object: SkylarkObjectMeta | null,
  contentTypesToRequest: SkylarkObjectMeta[] | null,
  addLanguageVariable?: boolean,
  opts?: { fetchAvailability?: boolean },
) => {
  if (!object || !object.operations.get || !contentTypesToRequest) {
    return null;
  }
  const common = generateVariablesAndArgs(
    object.name,
    "Query",
    addLanguageVariable,
  );

  const query = {
    query: {
      __name: createGetObjectContentQueryName(object.name),
      __variables: {
        ...common.variables,
        uid: "String!",
        nextToken: "String",
      },
      getObjectContent: {
        __aliasFor: object.operations.get.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
        },
        __typename: true,
        ...generateContentsToReturn(object, contentTypesToRequest, {
          nextTokenVariableName: "nextToken",
          fetchAvailability: opts?.fetchAvailability,
        }),
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetObjectContentOfQuery = (
  object: SkylarkObjectMeta | null,
  setObjects: SkylarkObjectMeta[],
) => {
  if (!object || !object.operations.get) {
    return null;
  }

  const common = generateVariablesAndArgs(object.name, "Query", false);

  const query = {
    query: {
      __name: createGetObjectContentOfQueryName(object.name),
      __variables: {
        uid: "String!",
        nextToken: "String",
        ...common.variables,
      },
      getObjectContentOf: {
        __aliasFor: object.operations.get.name,
        __args: {
          uid: new VariableType("uid"),
          ...common.args,
        },
        content_of: {
          __args: {
            limit: 20,
            next_token: new VariableType("nextToken"),
          },
          next_token: true,
          count: true,
          objects: {
            __on: setObjects.map((object) => {
              const common = generateVariablesAndArgs(object.name, "Query");
              return {
                __typeName: object.name,
                __typename: true, // To remove the alias later
                ...common.fields,
                ...generateFieldsToReturn(
                  object.fields,
                  object.name,
                  false,
                  `__${object.name}__`,
                ),
                ...(object.availability
                  ? {
                      availability: generateAvailabilityRelationshipFields(
                        object.availability,
                      ),
                    }
                  : {}),
              };
            }),
          },
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
