import { IResultMetadata } from "dromo-uploader-react";
import { GraphQLClient } from "graphql-request";
import { EnumType } from "json-to-graphql-query";

import {
  FlatfileObjectsCreatedInSkylarkFields,
  FlatfileObjectsCreatedInSkylark,
} from "src/interfaces/flatfile/responses";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectMeta,
  SkylarkImportedObject,
  GQLSkylarkError,
  SkylarkSystemField,
  BuiltInSkylarkObjectType,
  GQLSkylarkErrorResponse,
} from "src/interfaces/skylark";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";
import { parseMetadataForGraphQLRequest } from "src/lib/skylark/parsers";
import { chunkArray, hasProperty } from "src/lib/utils";

const filterEmptyOrNonStrings = (arr: unknown[]) => {
  return arr.filter(
    (item): item is string => Boolean(item) && typeof item === "string",
  );
};

const parseDromoAvailability = (
  dromoObject: Record<string, SkylarkObjectMetadataField>,
) => {
  if (
    hasProperty(dromoObject, "availability") &&
    Array.isArray(dromoObject.availability) &&
    dromoObject.availability?.[0]
  ) {
    return {
      availability: {
        link: filterEmptyOrNonStrings(dromoObject.availability),
      },
    };
  }

  return {};
};

const parseDromoAvailabilityDimensions = (
  dromoObject: Record<string, SkylarkObjectMetadataField>,
) => {
  const parsedDimensions = Object.entries(dromoObject).reduce(
    (prev, [key, value]) => {
      if (key.startsWith("dimension_") && Array.isArray(value) && value?.[0]) {
        return [
          ...prev,
          {
            dimension_slug: key.replace("dimension_", ""),
            value_slugs: filterEmptyOrNonStrings(value),
          },
        ];
      }

      return prev;
    },
    [] as { dimension_slug: string; value_slugs: string[] }[],
  );

  return parsedDimensions.length > 0
    ? { dimensions: { link: parsedDimensions } }
    : {};
};

const parseDromoRelationships = (
  dromoObject: Record<string, SkylarkObjectMetadataField>,
  relationships: SkylarkObjectMeta["relationships"],
) => {
  const relationshipNames = relationships.map(
    ({ relationshipName }) => relationshipName,
  );

  const parsedRelationships = Object.entries(dromoObject).reduce(
    (prev, [key, value]) => {
      if (
        relationshipNames.includes(key) &&
        Array.isArray(value) &&
        value?.[0]
      ) {
        return {
          ...prev,
          [key]: {
            link: filterEmptyOrNonStrings(value),
          },
        };
      }

      return prev;
    },
    {},
  );

  return Object.keys(parsedRelationships).length > 0
    ? { relationships: parsedRelationships }
    : {};
};

export const createDromoObjectsInSkylark = async (
  client: GraphQLClient,
  objectMeta: SkylarkObjectMeta,
  dromoObjects: Record<string, SkylarkObjectMetadataField>[],
  dromoImportMetadata: IResultMetadata,
  language: string | null,
): Promise<{
  data: SkylarkImportedObject[];
  errors: (GQLSkylarkError<FlatfileObjectsCreatedInSkylarkFields> | Error)[];
}> => {
  const objectType = objectMeta.name;

  const chunkedObjects = chunkArray(dromoObjects, 50);

  const dataArr = await Promise.all(
    chunkedObjects.map(
      async (
        objects,
        chunkIndex,
      ): Promise<{
        data: SkylarkImportedObject[];
        errors: (
          | GQLSkylarkError<FlatfileObjectsCreatedInSkylarkFields>
          | Error
        )[];
      }> => {
        const operations = objects.reduce(
          (previousOperations, data, index) => {
            const parsedMetadata = parseMetadataForGraphQLRequest(
              objectType,
              data,
              objectMeta.operations.create.inputs,
              true,
            );

            const externalId = hasProperty<
              Record<string, string | EnumType>,
              string,
              string
            >(parsedMetadata, SkylarkSystemField.ExternalID)
              ? parsedMetadata[SkylarkSystemField.ExternalID]
              : null;

            // If External ID, use update, if not use create
            // Availability doesn't support upsert
            const useUpdate =
              externalId &&
              objectMeta.name !== BuiltInSkylarkObjectType.Availability;
            const objectMetaOperation = useUpdate
              ? objectMeta.operations.update
              : objectMeta.operations.create;

            const operation = {
              __aliasFor: objectMetaOperation.name,
              __args: {
                ...(useUpdate ? { external_id: externalId, upsert: true } : {}),
                ...(objectMeta.name !== BuiltInSkylarkObjectType.Availability &&
                language
                  ? { language }
                  : {}),
                [objectMetaOperation.argName]: {
                  ...parsedMetadata,
                  ...parseDromoRelationships(data, objectMeta.relationships),
                  ...parseDromoAvailability(data),
                  ...parseDromoAvailabilityDimensions(data),
                },
              },
              uid: true,
              external_id: true,
            };

            console.log({ operation });
            const updatedOperations = {
              ...previousOperations,
              [`${objectMetaOperation.name}_${dromoImportMetadata.importIdentifier}__${chunkIndex + 1}_${index + 1}`.replace(
                /-/g,
                "_",
              )]: operation,
            };
            return updatedOperations;
          },
          {} as { [key: string]: object },
        );

        const mutation = {
          mutation: {
            __name:
              `DROMO_IMPORT_${objectType}_${dromoImportMetadata.importIdentifier}`.replace(
                /-/g,
                "_",
              ),
            ...operations,
          },
        };

        const graphQLMutation = wrappedJsonMutation(mutation, { pretty: true });

        try {
          const responseData =
            await client.request<FlatfileObjectsCreatedInSkylark>(
              graphQLMutation,
            );
          const data = Object.values(
            responseData as FlatfileObjectsCreatedInSkylark,
          );
          return { errors: [], data };
        } catch (err) {
          if (hasProperty(err, "response")) {
            const { response } =
              err as GQLSkylarkErrorResponse<FlatfileObjectsCreatedInSkylarkFields>;
            return {
              errors: response.errors,
              data: response.data ? Object.values(response.data) : [],
            };
          }
          return {
            errors: [err as Error],
            data: [],
          };
        }
      },
    ),
  );

  const data = dataArr.flatMap(({ data }) => data);
  const errors = dataArr
    .flatMap(({ errors }) => errors)
    .filter((error) => !!error);

  return {
    data,
    errors,
  };
};
