import {
  IJsonToGraphQLOptions,
  VariableType,
  jsonToGraphQLQuery,
} from "json-to-graphql-query";

import { MAX_GRAPHQL_LIMIT, OBJECT_OPTIONS } from "src/constants/skylark";
import {
  SkylarkGraphQLObject,
  SkylarkObjectMeta,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { isAvailabilityOrAudienceSegment } from "src/lib/utils";

import { createDynamicContentQueryField } from "./dynamicContent";

const fieldNamesToNeverAlias: string[] = [
  SkylarkSystemField.UID,
  SkylarkSystemField.ExternalID,
];

export const wrapQueryName = (str: string) => `SL_UI_${str}`.toUpperCase();

export const wrappedJsonQuery = (
  obj: { query: object & { __name: string } },
  options?: IJsonToGraphQLOptions,
): string => {
  const wrappedQueryName = wrapQueryName(obj.query.__name);

  return jsonToGraphQLQuery(
    {
      ...obj,
      query: {
        ...obj.query,
        __name: wrappedQueryName,
      },
    },
    options,
  );
};

export const wrappedJsonMutation = (
  obj: { mutation: object & { __name: string } },
  options?: IJsonToGraphQLOptions,
): string => {
  const wrappedQueryName = wrapQueryName(obj.mutation.__name);

  return jsonToGraphQLQuery(
    {
      ...obj,
      mutation: {
        ...obj.mutation,
        __name: wrappedQueryName,
      },
    },
    options,
  );
};

export const getObjectConfigFields = (withFieldConfig: boolean) => ({
  _config: {
    primary_field: true,
    colour: true,
    display_name: true,
    ...(withFieldConfig
      ? {
          field_config: {
            name: true,
            ui_field_type: true,
            ui_position: true,
          },
        }
      : {}),
  },
});

const commonGraphQLOpts = {
  variables: {},
  args: {},
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
      modified: {
        date: true,
      },
      created: {
        date: true,
      },
      published: true,
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

export const generateDimensionsAndValuesFieldsToReturn = (
  nextTokenName?: string,
): object => {
  const base = {
    __args: {
      limit: MAX_GRAPHQL_LIMIT,
    },
    next_token: true,
    objects: {
      uid: true,
      external_id: true,
      title: true,
      slug: true,
      description: true,
      values: {
        __args: {
          limit: MAX_GRAPHQL_LIMIT,
        },
        next_token: true,
        objects: {
          uid: true,
          external_id: true,
          title: true,
          slug: true,
          description: true,
        },
      },
    },
  };

  if (nextTokenName) {
    return {
      ...base,
      __args: {
        ...base.__args,
        next_token: new VariableType(nextTokenName),
      },
    };
  }

  return base;
};

export const generateVariablesAndArgs = (
  objectType: SkylarkObjectType | "search" | "genericGetObject",
  operationType: "Query" | "Mutation",
  addLanguageVariable = false,
): {
  variables: object;
  args: object;
  fields: object;
} => {
  const language = getLanguageVariableAndArg(addLanguageVariable);
  const ignoreAvailability = getIgnoreAvailabilityVariableAndArg(
    operationType === "Query" &&
      objectType !== "search" &&
      objectType !== "genericGetObject",
  );
  if (isAvailabilityOrAudienceSegment(objectType)) {
    return {
      variables: {},
      args: {},
      fields: {},
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
      ...commonGraphQLOpts.objectMeta,
    },
  };
};

export const generateFieldsToReturn = (
  fields: SkylarkObjectMeta["fields"],
  objectType: string | null,
  ignoreUid?: boolean,
  fieldAliasPrefix?: string,
) => {
  const fieldsToReturn = fields.reduce((previous, field) => {
    const options = objectType
      ? OBJECT_OPTIONS.find(({ objectTypes }) =>
          objectTypes.includes(objectType),
        )
      : null;

    if (options && options.hiddenFields.includes(field.name)) {
      return previous;
    }

    if (ignoreUid && field.name.toLowerCase() === "uid") {
      return previous;
    }

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

export const generateAvailabilityRelationshipFields = (
  objectAvailability: SkylarkObjectMeta,
) => ({
  __args: {
    limit: MAX_GRAPHQL_LIMIT,
  },
  next_token: true,
  time_window_status: true,
  objects: {
    ...generateFieldsToReturn(
      objectAvailability?.fields,
      objectAvailability.name,
    ),
  },
});

export const generateRelationshipsToReturn = (
  object: SkylarkObjectMeta | null,
  isSearch?: boolean,
): object => {
  if (!object) {
    return {};
  }

  const relationshipsToReturn: Record<string, object> = {};

  if (object.availability) {
    // Search uses the time_window_status field to show status
    if (isSearch) {
      relationshipsToReturn.availability = {
        time_window_status: true,
      };
    } else {
      relationshipsToReturn.availability =
        generateAvailabilityRelationshipFields(object.availability);
    }
  }

  if (object.isSet) {
    relationshipsToReturn.dynamic_content = createDynamicContentQueryField(
      false,
      null,
    );
  }

  const builtinObjectRelationships = object.builtinObjectRelationships;

  if (
    isSearch &&
    builtinObjectRelationships &&
    builtinObjectRelationships.images &&
    builtinObjectRelationships.images.objectMeta?.fields
  ) {
    builtinObjectRelationships.images.relationshipNames.forEach(
      (relationshipName) => {
        relationshipsToReturn[relationshipName] = {
          __args: {
            limit: 5, // Fetch 5 images when Searching
          },
          next_token: true,
          objects: {
            ...commonGraphQLOpts.objectMeta,
            ...generateFieldsToReturn(
              builtinObjectRelationships.images?.objectMeta.fields || [],
              builtinObjectRelationships.images?.objectMeta.name || null,
            ),
          },
        };
      },
    );
  }

  if (isSearch && isAvailabilityOrAudienceSegment(object.name)) {
    relationshipsToReturn["dimensions"] =
      generateDimensionsAndValuesFieldsToReturn();
  }

  return relationshipsToReturn;
};

export const generateContentsToReturn = (
  object: SkylarkObjectMeta | null,
  objectsToRequest: SkylarkObjectMeta[],
  opts: {
    nextTokenVariableName: string;
    fetchAvailability?: boolean;
  },
) => {
  if (!object || !object.hasContent || objectsToRequest.length === 0) {
    return {};
  }

  return {
    content: {
      __args: {
        // order: new EnumType("ASC"),
        limit: MAX_GRAPHQL_LIMIT,
        next_token: new VariableType(opts.nextTokenVariableName),
      },
      next_token: true,
      objects: {
        object: {
          uid: true,
          __on: objectsToRequest.map((object) => ({
            __typeName: object.name,
            __typename: true, // To remove the alias later
            ...commonGraphQLOpts.objectMeta,
            ...generateFieldsToReturn(
              object.fields,
              object.name,
              true,
              `__${object.name}__`,
            ),
            ...(object.isSet
              ? { dynamic_content: createDynamicContentQueryField(false, null) }
              : {}),
            ...(opts.fetchAvailability && object.availability
              ? {
                  availability: generateAvailabilityRelationshipFields(
                    object.availability,
                  ),
                }
              : {}),
          })),
        },
        position: true,
        dynamic: true,
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

export const parseSortField = (sortField: string | null) =>
  sortField !== "__manual" ? sortField : null;
