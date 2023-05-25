import { gql } from "graphql-tag";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import { OBJECT_OPTIONS } from "src/constants/skylark";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import {
  parseMetadataForGraphQLRequest,
  parseUpdatedRelationshipObjects,
} from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

import {
  generateContentsToReturn,
  generateFieldsToReturn,
  generateRelationshipsToReturn,
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
) => {
  if (!object || !object.operations.delete) {
    return null;
  }

  const common = generateVariablesAndArgs(object.name, "Mutation", true);

  const mutation = {
    mutation: {
      __name: `DELETE_${object.name}`,
      __variables: {
        uid: "String!",
        ...common.variables,
      },
      deleteObject: {
        __aliasFor: object.operations.delete.name,
        __args: {
          uid: new VariableType("uid"),
          ...common.args,
        },
        uid: true,
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
    metadata,
    objectMeta.operations.update.inputs,
  );

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
    metadataWithHiddenFieldsRemoved,
    objectMeta.operations.update.inputs,
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_METADATA_${objectMeta.name}`,
      __variables: {
        ...common.variables,
        uid: "String!",
      },
      updateObjectMetadata: {
        __aliasFor: objectMeta.operations.update.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
          [objectMeta.operations.update.argName]: parsedMetadata,
        },
        __typename: true,
        ...common.fields,
        ...generateFieldsToReturn(objectMeta.fields),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectContentMutation = (
  object: SkylarkObjectMeta | null,
  currentContentObjects: ParsedSkylarkObjectContentObject[],
  updatedContentObjects: ParsedSkylarkObjectContentObject[],
  contentTypesToRequest: SkylarkObjectMeta[],
) => {
  if (!object || !object.operations.update) {
    return null;
  }

  const currentContentObjectUids = currentContentObjects.map(
    ({ object }) => object.uid,
  );
  const updatedContentObjectUids = updatedContentObjects.map(
    ({ object }) => object.uid,
  );

  const linkOrRepositionOperations = updatedContentObjects.map(
    ({ objectType, object: { uid } }, index): SetContentOperation => {
      const position = index + 1;
      if (currentContentObjectUids.includes(uid)) {
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

  const deleteOperations = currentContentObjects
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
        ...generateContentsToReturn(object, contentTypesToRequest),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectRelationshipsMutation = (
  object: SkylarkObjectMeta | null,
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null,
  originalRelationshipObjects: ParsedSkylarkObjectRelationships[] | null,
) => {
  if (
    !object ||
    !object.operations.update ||
    !updatedRelationshipObjects ||
    !originalRelationshipObjects
  ) {
    return null;
  }

  const relationships = object?.relationships || [];
  const objectsToLinkAndUnlink = relationships
    .map((relationship) =>
      parseUpdatedRelationshipObjects(
        relationship,
        updatedRelationshipObjects,
        originalRelationshipObjects,
      ),
    )
    .filter(
      ({ uidsToLink, uidsToUnlink }) =>
        uidsToLink.length > 0 || uidsToUnlink.length > 0,
    );

  const parsedRelationsToUpdate = objectsToLinkAndUnlink.reduce(
    (acc, { relationship, uidsToLink, uidsToUnlink }) => {
      return {
        ...acc,
        [relationship.relationshipName]: {
          link: uidsToLink,
          unlink: uidsToUnlink,
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
  originalAvailabilityObjects: ParsedSkylarkObject[] | null,
  updatedAvailabilityObjects: ParsedSkylarkObject[] | null,
) => {
  if (
    !object ||
    !object.operations.update ||
    !originalAvailabilityObjects ||
    !updatedAvailabilityObjects
  ) {
    return null;
  }

  const originalObjectUids = originalAvailabilityObjects.map(({ uid }) => uid);
  const updatedObjectUids = updatedAvailabilityObjects.map(({ uid }) => uid);

  const uidsToLink = updatedObjectUids.filter(
    (uid) => !originalObjectUids.includes(uid),
  );
  const uidsToUnlink = originalObjectUids.filter(
    (uid) => !updatedObjectUids.includes(uid),
  );

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
              unlink: uidsToUnlink,
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
