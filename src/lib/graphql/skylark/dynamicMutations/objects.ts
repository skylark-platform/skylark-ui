import { gql } from "graphql-tag";
import { EnumType, VariableType } from "json-to-graphql-query";

import { OBJECT_OPTIONS } from "src/constants/skylark";
import {
  BuiltInSkylarkObjectType,
  DynamicSetConfig,
  GQLObjectTypeRelationshipConfig,
  ModifiedRelationshipsObject,
  SkylarkObjectContentObject,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
  SkylarkObject,
  ModifiedContents,
  ModifiedAvailabilityDimensions,
  ModifiedAudienceSegments,
  SkylarkAvailabilityField,
} from "src/interfaces/skylark";
import {
  createDynamicSetContentInput,
  generateFieldsToReturn,
  generateVariablesAndArgs,
  parseSortField,
  wrappedJsonMutation,
} from "src/lib/graphql/skylark/dynamicQueries";
import { parseMetadataForGraphQLRequest } from "src/lib/skylark/parsers";
import { isAvailabilityOrAudienceSegment } from "src/lib/utils";

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

  const graphQLQuery = wrappedJsonMutation(mutation);

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
    true,
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

  const graphQLQuery = wrappedJsonMutation(mutation);

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

  const draftVariableObj = isAvailabilityOrAudienceSegment(objectMeta.name)
    ? {}
    : { draft: "Boolean = false" };

  const draftArgObj = isAvailabilityOrAudienceSegment(objectMeta.name)
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

  const graphQLQuery = wrappedJsonMutation(mutation);

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

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectContentMutation = (
  object: SkylarkObjectMeta | null,
  originalContentObjects: SkylarkObjectContentObject[] | null,
  updatedContentObjects: SkylarkObjectContentObject[] | null,
  modifiedConfig: ModifiedContents["config"],
) => {
  if (!object || !object.operations.update) {
    return null;
  }

  const originalContentObjectUids = originalContentObjects?.map(
    ({ uid }) => uid,
  );
  const updatedContentObjectUids = updatedContentObjects?.map(({ uid }) => uid);

  const linkOrRepositionOperations = updatedContentObjects
    ?.map(
      ({ objectType, uid, isDynamic }, index): SetContentOperation | null => {
        if (isDynamic) {
          return null;
        }

        const position = index + 1;
        if (originalContentObjectUids?.includes(uid)) {
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
    )
    .filter((op): op is SetContentOperation => op !== null);

  const deleteOperations = originalContentObjects
    ?.filter(
      ({ uid, isDynamic }) =>
        !isDynamic && !updatedContentObjectUids?.includes(uid),
    )
    .map(({ objectType, uid }): SetContentOperation => {
      return {
        operation: "unlink",
        objectType,
        uid,
        position: -1,
      };
    });

  const objectContentOperations = [
    ...(linkOrRepositionOperations || []),
    ...(deleteOperations || []),
  ];

  const setContent = objectContentOperations.reduce(
    (prev, { operation, objectType, uid, position }) => {
      const updatedOperations = prev?.[objectType] || {};

      if (operation === "unlink") {
        updatedOperations.unlink = [...(updatedOperations?.unlink || []), uid];
      } else {
        updatedOperations[operation] = [
          ...(updatedOperations?.[operation] || []),
          { uid, position },
        ];
      }

      return {
        ...prev,
        [objectType]: updatedOperations,
      };
    },
    {} as Record<
      string,
      {
        link?: { uid: string; position: number }[];
        unlink?: string[];
        reposition?: { uid: string; position: number }[];
      }
    >,
  );

  const contentConfig = modifiedConfig
    ? {
        content_sort_field: modifiedConfig.contentSortField || null,
        content_sort_direction: modifiedConfig.contentSortDirection
          ? new EnumType(modifiedConfig.contentSortDirection)
          : null,
        // content_limit: modifiedConfig.contentLimit || null,
      }
    : {};

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
            ...(objectContentOperations.length > 0
              ? { content: setContent }
              : {}),
            ...contentConfig,
          },
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectDynamicContentConfigurationMutation = (
  object: SkylarkObjectMeta | null,
  dynamicSetConfig: DynamicSetConfig,
) => {
  if (!object || !object.operations.update) {
    return null;
  }

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_DYNAMIC_CONTENT_CONFIGURATION_${object.name}`,
      __variables: {
        uid: "String!",
      },
      updateObjectContent: {
        __aliasFor: object.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [object.operations.update.argName]: {
            content_sort_field: parseSortField(
              dynamicSetConfig.contentSortField,
            ),
            content_sort_direction: dynamicSetConfig.contentSortDirection
              ? new EnumType(dynamicSetConfig.contentSortDirection)
              : null,
            content_limit: dynamicSetConfig.contentLimit || null,
            dynamic_content: createDynamicSetContentInput(dynamicSetConfig),
          },
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectRelationshipsMutation = (
  object: SkylarkObjectMeta | null,
  modifiedRelationships: ModifiedRelationshipsObject | null,
) => {
  if (!object || !object.operations.update || !modifiedRelationships) {
    return null;
  }

  const parsedRelationsToUpdate = Object.entries(modifiedRelationships).reduce(
    (acc, [relationshipName, { added, removed, config }]) => {
      const relationshipArg: {
        link?: string[];
        unlink?: string[];
        config?: Partial<GQLObjectTypeRelationshipConfig>;
      } = {};

      const linkedRelationships = [...new Set(added.map(({ uid }) => uid))];
      const unlinkedRelationships = [...new Set(removed)];

      if (linkedRelationships.length > 0) {
        relationshipArg.link = linkedRelationships;
      }

      if (unlinkedRelationships.length > 0) {
        relationshipArg.unlink = unlinkedRelationships;
      }

      if (config && Object.keys(config).length > 0) {
        const parsedConfig: Partial<GQLObjectTypeRelationshipConfig> = {};

        if (config.defaultSortField !== undefined) {
          parsedConfig.default_sort_field = parseSortField(
            config.defaultSortField,
          );
        }

        if (config.inheritAvailability !== undefined) {
          parsedConfig.inherit_availability = config.inheritAvailability;
        }

        if (Object.keys(parsedConfig).length > 0) {
          relationshipArg.config = parsedConfig;
        }
      }

      return {
        ...acc,
        [relationshipName]: relationshipArg,
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

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectAvailability = (
  object: SkylarkObjectMeta | null,
  modifiedAvailabilityObjects: {
    added: SkylarkObject[];
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

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

export const createUpdateAvailabilityDimensionsMutation = (
  objectMeta: SkylarkObjectMeta | null,
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null,
  modifiedAudienceSegments: ModifiedAudienceSegments | null,
) => {
  if (
    !objectMeta ||
    !isAvailabilityOrAudienceSegment(objectMeta.name) ||
    !objectMeta.operations.update ||
    (!modifiedAvailabilityDimensions && !modifiedAudienceSegments)
  ) {
    return null;
  }

  const parsedDimensionsForRequest: {
    link: {
      dimension_slug: string;
      value_slugs: string[];
    }[];
    unlink: {
      dimension_slug: string;
      value_slugs: string[];
    }[];
  } = modifiedAvailabilityDimensions
    ? Object.entries(modifiedAvailabilityDimensions).reduce(
        (acc, [dimensionSlug, { added, removed }]) => {
          if (added.length === 0 && removed.length === 0) {
            return acc;
          }

          const valuesToLink: string[] = added.filter(
            (value) => !removed.includes(value),
          );

          const valuesToUnlink: string[] = removed.filter(
            (value) => !added.includes(value),
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
      )
    : { link: [], unlink: [] };

  const mutation = {
    mutation: {
      __name: `UPDATE_${objectMeta.name}_DIMENSIONS_AND_SEGMENTS`,
      __variables: {
        uid: "String!",
      },
      updateAvailabilityDimensionsAndSegments: {
        __aliasFor: objectMeta.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [objectMeta.operations.update.argName]: {
            dimensions: {
              ...parsedDimensionsForRequest,
            },
            ...(objectMeta.name !== BuiltInSkylarkObjectType.AudienceSegment
              ? {
                  segments: {
                    link:
                      modifiedAudienceSegments?.added.map(({ uid }) => uid) ||
                      [],
                    unlink: modifiedAudienceSegments?.removed || [],
                  },
                }
              : {}),
          },
        },
        uid: true,
        [SkylarkAvailabilityField.DimensionBreakdown]: true,
      },
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

const createAvailabilityObjectLinkUnlinkOperations = (
  allObjectsMeta: SkylarkObjectMeta[],
  availabilityUid: string,
  objects: SkylarkObject[],
  type: "link" | "unlink",
) =>
  objects.reduce((previous, object) => {
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
      [`${type}_availability_${availabilityUid}_to_${object.objectType}_${object.uid}`]:
        {
          __aliasFor: objectMeta.operations.update.name,
          __args: {
            uid: object.uid,
            [objectMeta.operations.update.argName]: {
              availability: { [type]: availabilityUid },
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

export const createUpdateAvailabilityAssignedToMutation = (
  allObjectsMeta: SkylarkObjectMeta[] | null,
  availabilityUid: string,
  addedObjects: SkylarkObject[],
  removedObjects: SkylarkObject[],
) => {
  if (!allObjectsMeta || !availabilityUid) {
    return null;
  }

  const addOperations = createAvailabilityObjectLinkUnlinkOperations(
    allObjectsMeta,
    availabilityUid,
    addedObjects,
    "link",
  );
  const removeOperations = createAvailabilityObjectLinkUnlinkOperations(
    allObjectsMeta,
    availabilityUid,
    removedObjects,
    "unlink",
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_AVAILABILITY_ASSIGNED_TO`,
      ...addOperations,
      ...removeOperations,
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};
