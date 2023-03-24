import { gql } from "graphql-tag";
import {
  EnumType,
  jsonToGraphQLQuery,
  VariableType,
} from "json-to-graphql-query";

import {
  BuiltInSkylarkObjectType,
  SkylarkGraphQLObject,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";

const common = {
  variables: {
    ignoreAvailability: "Boolean = true",
  },
  args: {
    ignore_availability: new VariableType("ignoreAvailability"),
  },
  objectConfig: {
    _config: {
      primary_field: true,
      colour: true,
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

  if (!isSearch && object.images) {
    relationshipsToReturn.images = {
      __args: {
        limit: isSearch ? 5 : 50, // max
      },
      next_token: true,
      objects: {
        ...generateFieldsToReturn(object.images?.fields),
      },
    };
  }

  return relationshipsToReturn;
};

export const generateContentsToReturn = (
  object: SkylarkObjectMeta | null,
  objectsToRequest: SkylarkObjectMeta[],
) => {
  // Only Set has contents
  if (
    !object ||
    object.name !== BuiltInSkylarkObjectType.Set ||
    objectsToRequest.length === 0
  ) {
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
            ...common.objectConfig,
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

export const createGetObjectQuery = (
  object: SkylarkObjectMeta | null,
  contentTypesToRequest: SkylarkObjectMeta[],
  addLanguageVariable?: boolean,
) => {
  if (!object || !object.operations.get) {
    return null;
  }

  const argLanguage = addLanguageVariable
    ? { language: new VariableType("language") }
    : {};
  const variableLanguage = addLanguageVariable ? { language: "String" } : {};

  const query = {
    query: {
      __name: createGetObjectQueryName(object.name),
      __variables: {
        ...common.variables,
        ...variableLanguage, // TODO always send language variable when BE supports sending null without error
        uid: "String",
        externalId: "String",
      },
      getObject: {
        __aliasFor: object.operations.get.name,
        __args: {
          ...common.args,
          ...argLanguage, // TODO always send language variable when BE supports sending null without error
          uid: new VariableType("uid"),
          external_id: new VariableType("externalId"),
        },
        __typename: true,
        ...common.objectConfig,
        ...common.objectMeta,
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
) => {
  if (!object || !object.operations.get) {
    return null;
  }

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
          ...common.objectConfig,
          ...generateFieldsToReturn(object.fields),
          ...generateRelationshipsToReturn(object),
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

  const query = {
    query: {
      __name: "SEARCH",
      __variables: {
        ...common.variables,
        queryString: "String!",
        offset: "Int",
        limit: "Int",
        language: "String",
      },
      search: {
        __args: {
          ...common.args,
          query: new VariableType("queryString"),
          offset: new VariableType("offset"),
          limit: new VariableType("limit"),
          // language: null, TODO disable language searching when language filter is added
          language: new VariableType("language"),
        },
        __typename: true,
        objects: {
          __on: objectsToRequest.map((object) => ({
            __typeName: object.name,
            __typename: true, // To remove the alias later
            ...common.objectConfig,
            ...common.objectMeta,
            ...generateFieldsToReturn(object.fields, `__${object.name}__`),
            ...generateRelationshipsToReturn(object, true),
          })),
        },
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query);

  return gql(graphQLQuery);
};
