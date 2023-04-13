import { gql } from "graphql-tag";
import {
  EnumType,
  jsonToGraphQLQuery,
  VariableType,
} from "json-to-graphql-query";

import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  SkylarkGraphQLObject,
  SkylarkObjectMeta,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";

const fieldNamesToNeverAlias: string[] = [
  SkylarkSystemField.UID,
  SkylarkSystemField.ExternalID,
];

const commonGraphQLOpts = {
  variables: {},
  args: {},
  objectConfig: {
    _config: {
      primary_field: true,
      colour: true,
      display_name: true,
    },
  },
  objectMeta: {
    _meta: {
      available_languages: true,
      language_data: {
        language: true,
        version: true,
      },
      global_data: {
        version: true,
      },
    },
  },
};

const getLanguageVariableAndArg = (shouldAdd: boolean) => {
  const args = shouldAdd ? { language: new VariableType("language") } : {};
  const variables = shouldAdd ? { language: "String" } : {};
  return {
    args,
    variables,
  };
};

const getIgnoreAvailabilityVariableAndArg = (shouldAdd: boolean) => {
  const args = shouldAdd
    ? { ignore_availability: new VariableType("ignoreAvailability") }
    : {};
  const variables = shouldAdd ? { ignoreAvailability: "Boolean = true" } : {};
  return {
    args,
    variables,
  };
};

export const generateVariablesAndArgs = (
  objectType: SkylarkObjectType | "search",
  operationType: "Query" | "Mutation",
  addLanguageVariable = false,
): {
  variables: object;
  args: object;
  fields: object;
} => {
  const language = getLanguageVariableAndArg(addLanguageVariable);
  const ignoreAvailability = getIgnoreAvailabilityVariableAndArg(
    operationType === "Query",
  );
  if (objectType === BuiltInSkylarkObjectType.Availability) {
    return {
      variables: {},
      args: {},
      fields: {
        // ...commonGraphQLOpts.objectConfig,
      },
    };
  }

  return {
    variables: {
      ...commonGraphQLOpts.variables,
      ...ignoreAvailability.variables,
      ...language.variables,
    },
    args: {
      ...commonGraphQLOpts.args,
      ...ignoreAvailability.args,
      ...language.args,
    },
    fields: {
      ...commonGraphQLOpts.objectConfig,
      ...commonGraphQLOpts.objectMeta,
    },
  };
};

export const generateFieldsToReturn = (
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

const generateRelationshipsToReturn = (
  object: SkylarkObjectMeta | null,
  isSearch?: boolean,
): object => {
  if (!object) {
    return {};
  }

  const relationshipsToReturn: Record<string, object> = {};

  if (object.availability) {
    relationshipsToReturn.availability = {
      __args: {
        limit: 50, // max
      },
      next_token: true,
      objects: {
        ...generateFieldsToReturn(object.availability?.fields),
      },
    };
  }

  if (!isSearch && object.images && object.images.objectMeta?.fields) {
    object.images.relationshipNames.forEach((relationshipName) => {
      relationshipsToReturn[relationshipName] = {
        __args: {
          limit: isSearch ? 5 : 50, // max
        },
        next_token: true,
        objects: {
          ...commonGraphQLOpts.objectMeta,
          ...generateFieldsToReturn(object.images?.objectMeta.fields || []),
        },
      };
    });
  }

  return relationshipsToReturn;
};

export const generateContentsToReturn = (
  object: SkylarkObjectMeta | null,
  objectsToRequest: SkylarkObjectMeta[],
) => {
  if (!object || !object.hasContent || objectsToRequest.length === 0) {
    return {};
  }

  return {
    content: {
      __args: {
        order: new EnumType("ASC"),
        limit: 50,
      },
      objects: {
        object: {
          __on: objectsToRequest.map((object) => ({
            __typeName: object.name,
            __typename: true, // To remove the alias later
            ...commonGraphQLOpts.objectConfig,
            ...commonGraphQLOpts.objectMeta,
            ...generateFieldsToReturn(object.fields, `__${object.name}__`),
          })),
        },
        position: true,
      },
    },
  };
};

// When making a search / set content request, we use GraphQL value aliases to eliminate any clashes between
// object types in the Skylark schema sharing the same value name but with different types - causes errors
// e.g. an image type with a string and a set type with a required string are different types and throw an error
// From docs:
// - If multiple field selections with the same response names are encountered during execution,
//   the field and arguments to execute and the resulting value should be unambiguous.
//   Therefore any two field selections which might both be encountered for the same object are only valid if they are equivalent.
export const removeFieldPrefixFromReturnedObject = <T>(
  objectWithPrefix: SkylarkGraphQLObject,
) => {
  const searchAliasPrefix = `__${objectWithPrefix.__typename}__`;
  const result = Object.fromEntries(
    Object.entries(objectWithPrefix).map(([key, val]) => {
      const newKey = key.startsWith(searchAliasPrefix)
        ? key.replace(searchAliasPrefix, "")
        : key;
      return [newKey, val];
    }),
  );
  return result as T;
};

export const createGetObjectQueryName = (objectType: string) =>
  `GET_${objectType}`;
export const createGetObjectAvailabilityQueryName = (objectType: string) =>
  `GET_${objectType}_AVAILABILITY`;
export const createGetObjectRelationshipsQueryName = (objectType: string) =>
  `GET_${objectType}_RELATIONSHIPS`;

export const createGetObjectQuery = (
  object: SkylarkObjectMeta | null,
  contentTypesToRequest: SkylarkObjectMeta[],
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
        ...generateFieldsToReturn(object.fields),
        ...generateRelationshipsToReturn(object),
        ...generateContentsToReturn(object, contentTypesToRequest),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query);

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
            limit: 5,
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

  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};

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
              ...generateFieldsToReturn(object.fields, `__${object.name}__`),
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

  const query = {
    query: {
      __name: createGetObjectRelationshipsQueryName(object.name),
      __variables: {
        uid: "String",
        nextToken: "String",
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
                limit: 50,
                next_token: new VariableType("nextToken"),
              },
              next_token: true,
              objects: {
                uid: true,
                __typename: true,
                ...generateFieldsToReturn(
                  relationshipsFields[currentValue.objectType],
                ),
                ...common.fields,
              },
            },
          };
        }, {}),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};

export const createGetAllObjectsConfigQuery = (
  objectTypes?: SkylarkObjectType[],
) => {
  if (!objectTypes) {
    return null;
  }

  const query = {
    query: {
      __name: "GET_OBJECTS_CONFIG",
      ...objectTypes.reduce((acc, objectType) => {
        return {
          ...acc,
          [objectType]: {
            __aliasFor: "getObjectConfiguration",
            __args: {
              object: new EnumType(objectType),
            },
            ...commonGraphQLOpts.objectConfig._config,
          },
        };
      }, {}),
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query, { pretty: true });

  return gql(graphQLQuery);
};
