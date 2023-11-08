import { gql } from "graphql-tag";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import { OBJECT_OPTIONS } from "src/constants/skylark";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  ParsedSkylarkObjectContentObject,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { parseMetadataForGraphQLRequest } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

import {
  generateFieldsToReturn,
  generateVariablesAndArgs,
} from "./dynamicQueries";

interface SetContentOperation {
  operation: "link" | "unlink" | "reposition";
  uid: string;
  objectType: SkylarkObjectType;
  position: number;
}

export const createDeleteObjectMutation = (
  object: SkylarkObjectMeta | null,
  isDeleteTranslation: boolean,
) => {
  if (!object || !object.operations.delete) {
    return null;
  }

  const common = generateVariablesAndArgs(object.name, "Mutation", false);

  let language = {
    variable: {},
    arg: {},
  };
  if (isDeleteTranslation) {
    language = {
      variable: {
        language: "String!",
      },
      arg: {
        language: new VariableType("language"),
      },
    };
  }

  const returnFields =
    object.name === BuiltInSkylarkObjectType.Availability ? {} : { uid: true };

  const mutation = {
    mutation: {
      __name: `DELETE_${object.name}`,
      __variables: {
        uid: "String!",
        ...language.variable,
        ...common.variables,
      },
      deleteObject: {
        __aliasFor: object.operations.delete.name,
        __args: {
          uid: new VariableType("uid"),
          ...language.arg,
          ...common.args,
        },
        ...returnFields,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createCreateObjectMutation = (
  objectMeta: SkylarkObjectMeta | null,
  metadata: Record<string, SkylarkObjectMetadataField>,
  addLanguageVariable = false,
) => {
  if (!objectMeta || !objectMeta.operations.update) {
    return null;
  }

  const parsedMetadata = parseMetadataForGraphQLRequest(
    objectMeta.name,
    metadata,
    objectMeta.operations.update.inputs,
  );

  // Don't send a blank External ID
  if (
    hasProperty(parsedMetadata, SkylarkSystemField.ExternalID) &&
    !parsedMetadata.external_id
  ) {
    delete parsedMetadata.external_id;
  }

  const common = generateVariablesAndArgs(
    objectMeta.name,
    "Mutation",
    addLanguageVariable,
  );

  const mutation = {
    mutation: {
      __name: `CREATE_OBJECT_${objectMeta.name}`,
      __variables: common.variables,
      createObject: {
        __aliasFor: objectMeta.operations.create.name,
        __args: {
          ...common.args,
          [objectMeta.operations.create.argName]: parsedMetadata,
        },
        ...common.fields,
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectMetadataMutation = (
  objectMeta: SkylarkObjectMeta | null,
  metadata: Record<string, SkylarkObjectMetadataField>,
  addLanguageVariable = false,
) => {
  if (!objectMeta || !objectMeta.operations.update) {
    return null;
  }

  const common = generateVariablesAndArgs(
    objectMeta.name,
    "Mutation",
    addLanguageVariable,
  );

  const options = OBJECT_OPTIONS.find(({ objectTypes }) =>
    objectTypes.includes(objectMeta.name),
  );

  const metadataWithHiddenFieldsRemoved = options
    ? Object.fromEntries(
        Object.entries(metadata).filter(
          ([key]) => !options?.hiddenFields.includes(key),
        ),
      )
    : metadata;

  const parsedMetadata = parseMetadataForGraphQLRequest(
    objectMeta.name,
    metadataWithHiddenFieldsRemoved,
    objectMeta.operations.update.inputs,
  );

  const draftVariableObj =
    objectMeta.name === BuiltInSkylarkObjectType.Availability
      ? {}
      : { draft: "Boolean = false" };

  const draftArgObj =
    objectMeta.name === BuiltInSkylarkObjectType.Availability
      ? {}
      : { draft: new VariableType("draft") };

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_METADATA_${objectMeta.name}`,
      __variables: {
        ...common.variables,
        ...draftVariableObj,
        uid: "String!",
      },
      updateObjectMetadata: {
        __aliasFor: objectMeta.operations.update.name,
        __args: {
          ...common.args,
          ...draftArgObj,
          uid: new VariableType("uid"),
          [objectMeta.operations.update.argName]: parsedMetadata,
        },
        __typename: true,
        ...common.fields,
        ...generateFieldsToReturn(objectMeta.fields, objectMeta.name),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createPublishVersionMutation = (
  objectMeta: SkylarkObjectMeta | null,
  addLanguageVariable = false,
) => {
  if (!objectMeta || !objectMeta.operations.update) {
    return null;
  }

  const common = generateVariablesAndArgs(
    objectMeta.name,
    "Mutation",
    addLanguageVariable,
  );

  const mutation = {
    mutation: {
      __name: `PUBLISH_${objectMeta.name}`,
      __variables: {
        ...common.variables,
        uid: "String!",
        languageVersion: "Int",
        globalVersion: "Int",
      },
      updateObjectMetadata: {
        __aliasFor: objectMeta.operations.update.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
          draft: false,
          language_version: new VariableType("languageVersion"),
          global_version: new VariableType("globalVersion"),
        },
        __typename: true,
        ...common.fields,
        ...generateFieldsToReturn(objectMeta.fields, objectMeta.name),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectContentMutation = (
  object: SkylarkObjectMeta | null,
  originalContentObjects: ParsedSkylarkObjectContentObject[] | null,
  updatedContentObjects: ParsedSkylarkObjectContentObject[] | null,
) => {
  if (
    !object ||
    !object.operations.update ||
    !originalContentObjects ||
    !updatedContentObjects
  ) {
    return null;
  }

  const originalContentObjectUids = originalContentObjects.map(
    ({ object }) => object.uid,
  );
  const updatedContentObjectUids = updatedContentObjects.map(
    ({ object }) => object.uid,
  );

  const linkOrRepositionOperations = updatedContentObjects.map(
    ({ objectType, object: { uid } }, index): SetContentOperation => {
      const position = index + 1;
      if (originalContentObjectUids.includes(uid)) {
        return {
          operation: "reposition",
          objectType,
          uid,
          position,
        };
      }
      return {
        operation: "link",
        objectType,
        uid,
        position,
      };
    },
  );

  const deleteOperations = originalContentObjects
    .filter(({ object: { uid } }) => !updatedContentObjectUids.includes(uid))
    .map(({ objectType, object: { uid } }): SetContentOperation => {
      return {
        operation: "unlink",
        objectType,
        uid,
        position: -1,
      };
    });

  const objectContentOperations = [
    ...linkOrRepositionOperations,
    ...deleteOperations,
  ];

  const setContent = objectContentOperations.reduce(
    (prev, { operation, objectType, uid, position }) => {
      const updatedOperations = prev[objectType] || {
        link: [],
        unlink: [],
        reposition: [],
      };

      if (operation === "unlink") {
        updatedOperations.unlink.push(uid);
      } else {
        updatedOperations[operation].push({ uid, position });
      }

      return {
        ...prev,
        [objectType]: updatedOperations,
      };
    },
    {} as Record<
      string,
      {
        link: { uid: string; position: number }[];
        unlink: string[];
        reposition: { uid: string; position: number }[];
      }
    >,
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_CONTENT_${object.name}`,
      __variables: {
        uid: "String!",
      },
      updateObjectContent: {
        __aliasFor: object.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [object.operations.update.argName]: {
            content: setContent,
          },
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectRelationshipsMutation = (
  object: SkylarkObjectMeta | null,
  modifiedRelationships: Record<
    string,
    {
      added: ParsedSkylarkObject[];
      removed: string[];
    }
  > | null,
) => {
  if (!object || !object.operations.update || !modifiedRelationships) {
    return null;
  }

  const parsedRelationsToUpdate = Object.entries(modifiedRelationships).reduce(
    (acc, [relationshipName, { added, removed }]) => {
      return {
        ...acc,
        [relationshipName]: {
          link: [...new Set(added.map(({ uid }) => uid))],
          unlink: [...new Set(removed)],
        },
      };
    },
    {},
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_RELATIONSHIPS_${object.name}`,
      __variables: {
        uid: "String!",
      },
      updateObjectRelationships: {
        __aliasFor: object.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [object.operations.update.argName]: {
            relationships: {
              ...parsedRelationsToUpdate,
            },
          },
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectAvailability = (
  object: SkylarkObjectMeta | null,
  modifiedAvailabilityObjects: {
    added: ParsedSkylarkObject[];
    removed: string[];
  } | null,
) => {
  if (!object || !object.operations.update || !modifiedAvailabilityObjects) {
    return null;
  }

  const uidsToLink = modifiedAvailabilityObjects.added.map(({ uid }) => uid);

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_AVAILABILITY_${object.name}`,
      __variables: {
        uid: "String!",
      },
      updateAvailabilityObjects: {
        __aliasFor: object.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [object.operations.update.argName]: {
            availability: {
              link: uidsToLink,
              unlink: modifiedAvailabilityObjects.removed,
            },
          },
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateAvailabilityDimensionsMutation = (
  objectMeta: SkylarkObjectMeta | null,
  originalAvailabilityDimensionValues: Record<string, string[]> | null,
  updatedAvailabilityDimensionValues: Record<string, string[]> | null,
) => {
  if (
    !objectMeta ||
    objectMeta.name !== BuiltInSkylarkObjectType.Availability ||
    !objectMeta.operations.update ||
    !updatedAvailabilityDimensionValues ||
    !originalAvailabilityDimensionValues
  ) {
    return null;
  }

  const dimensionSlugs = [
    ...new Set([
      ...Object.keys(originalAvailabilityDimensionValues),
      ...Object.keys(updatedAvailabilityDimensionValues),
    ]),
  ];

  const parsedDimensionsForRequest: {
    link: {
      dimension_slug: string;
      value_slugs: string[];
    }[];
    unlink: {
      dimension_slug: string;
      value_slugs: string[];
    }[];
  } = dimensionSlugs.reduce(
    (acc, dimensionSlug) => {
      const originalDimensionValues =
        hasProperty(originalAvailabilityDimensionValues, dimensionSlug) &&
        originalAvailabilityDimensionValues[dimensionSlug];

      const updatedDimensionValues =
        hasProperty(updatedAvailabilityDimensionValues, dimensionSlug) &&
        updatedAvailabilityDimensionValues[dimensionSlug];

      if (!updatedDimensionValues) {
        return acc;
      }

      if (!originalDimensionValues) {
        return {
          ...acc,
          link: [
            ...acc.link,
            {
              dimension_slug: dimensionSlug,
              value_slugs: updatedDimensionValues,
            },
          ],
        };
      }

      const valuesToLink: string[] = !originalDimensionValues
        ? updatedDimensionValues
        : updatedDimensionValues.filter(
            (value) => !originalDimensionValues.includes(value),
          );

      const valuesToUnlink: string[] = originalDimensionValues.filter(
        (value) => !updatedDimensionValues.includes(value),
      );

      return {
        link:
          valuesToLink.length === 0
            ? acc.link
            : [
                ...acc.link,
                {
                  dimension_slug: dimensionSlug,
                  value_slugs: valuesToLink,
                },
              ],
        unlink:
          valuesToUnlink.length === 0
            ? acc.unlink
            : [
                ...acc.unlink,
                {
                  dimension_slug: dimensionSlug,
                  value_slugs: valuesToUnlink,
                },
              ],
      };
    },
    {
      link: [] as { dimension_slug: string; value_slugs: string[] }[],
      unlink: [] as { dimension_slug: string; value_slugs: string[] }[],
    },
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_AVAILABILITY_DIMENSIONS`,
      __variables: {
        uid: "String!",
      },
      updateAvailabilityDimensions: {
        __aliasFor: objectMeta.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [objectMeta.operations.update.argName]: {
            dimensions: {
              ...parsedDimensionsForRequest,
            },
          },
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateAvailabilityAssignedToMutation = (
  allObjectsMeta: SkylarkObjectMeta[] | null,
  availabilityUid: string,
  addedObjects: ParsedSkylarkObject[],
) => {
  if (!allObjectsMeta || !availabilityUid || addedObjects.length === 0) {
    return null;
  }

  const operations = addedObjects.reduce((previous, object) => {
    if (object.objectType === BuiltInSkylarkObjectType.Availability) {
      return previous;
    }

    const objectMeta = allObjectsMeta.find(
      ({ name }) => name === object.objectType,
    );
    if (!objectMeta) {
      return previous;
    }

    const operation = {
      [`assign_availability_${availabilityUid}_to_${object.objectType}_${object.uid}`]:
        {
          __aliasFor: objectMeta.operations.update.name,
          __args: {
            uid: object.uid,
            [objectMeta.operations.update.argName]: {
              availability: { link: availabilityUid },
            },
          },
          uid: true,
        },
    };

    return {
      ...previous,
      ...operation,
    };
  }, {});

  const mutation = {
    mutation: {
      __name: `UPDATE_AVAILABILITY_ASSIGNED_TO`,
      ...operations,
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};
