import { ITheme } from "@flatfile/sdk/dist/types";
import dayjs from "dayjs";
import { IResultMetadata } from "dromo-uploader-react";
import { GraphQLClient } from "graphql-request";
import { EnumType } from "json-to-graphql-query";

import { TEMPLATE_FIELDS_TO_IGNORE } from "src/constants/flatfile";
import {
  FlatfileObjectsCreatedInSkylark,
  FlatfileObjectsCreatedInSkylarkFields,
  FlatfileRow,
} from "src/interfaces/flatfile/responses";
import {
  BuiltInSkylarkObjectType,
  GQLSkylarkError,
  GQLSkylarkErrorResponse,
  NormalizedObjectField,
  NormalizedObjectFieldType,
  ParsedSkylarkDimensionsWithValues,
  SkylarkImportedObject,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";
import { getSkylarkObjectOperations } from "src/lib/skylark/introspection/introspection";
import {
  parseInputFieldValue,
  parseMetadataForGraphQLRequest,
} from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

const chunkArray = <T>(arr: T[], chunkSize: number) => {
  const chunkedArray: T[][] = [];

  for (let index = 0; index < arr.length; index += chunkSize) {
    chunkedArray.push(arr.slice(index, index + chunkSize));
  }

  return chunkedArray;
};

export const openFlatfileImportClient = async (
  embedId: string,
  importToken: string,
  onComplete: (batchId: string) => void,
) => {
  const theme: ITheme = {
    loadingText: "Creating your records in Skylark...",
    displayName: "Skylark",
    logo: "https://assets.website-files.com/5f108589f5a3742f55bcf61c/602e8d596dd9ee3bef0846f6_Skylark%20Logo%20H%20Text.svg",
  };

  // Import Flatfile clientside otherwise it errors
  const Flatfile = (await import("@flatfile/sdk")).Flatfile;

  await Flatfile.requestDataFromUser({
    embedId,
    token: importToken,
    theme,
    onComplete(payload) {
      onComplete(payload.batchId);
    },
  });
};

export const createFlatfileObjectsInSkylark = async (
  client: GraphQLClient,
  objectType: string,
  flatfileBatchId: string,
  allFlatfileRows: FlatfileRow[],
): Promise<{
  data: SkylarkImportedObject[];
  errors: (GQLSkylarkError<FlatfileObjectsCreatedInSkylarkFields> | Error)[];
}> => {
  const skylarkObjectOperations: SkylarkObjectMeta["operations"] =
    await getSkylarkObjectOperations(client, objectType);

  const chunkedFlatfileRows = chunkArray(allFlatfileRows, 50);

  const dataArr = await Promise.all(
    chunkedFlatfileRows.map(
      async (
        flatfileRows,
      ): Promise<{
        data: SkylarkImportedObject[];
        errors: (
          | GQLSkylarkError<FlatfileObjectsCreatedInSkylarkFields>
          | Error
        )[];
      }> => {
        const operations = flatfileRows.reduce(
          (previousOperations, { id, data }) => {
            const parsedData = parseMetadataForGraphQLRequest(
              objectType,
              data,
              skylarkObjectOperations.create.inputs,
              true,
            );

            const operation = {
              __aliasFor: skylarkObjectOperations.create.name,
              __args: {
                [skylarkObjectOperations.create.argName]: parsedData,
              },
              uid: true,
              external_id: true,
            };

            const updatedOperations = {
              ...previousOperations,
              [`${skylarkObjectOperations.create.name}_${flatfileBatchId}_${id}`.replace(
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
            __name: `FLATFILE_IMPORT_${objectType}_${flatfileBatchId}`.replace(
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
): Promise<{
  data: SkylarkImportedObject[];
  errors: (GQLSkylarkError<FlatfileObjectsCreatedInSkylarkFields> | Error)[];
}> => {
  const objectType = objectMeta.name;
  const createOperation = objectMeta.operations.create;

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
              createOperation.inputs,
              true,
            );

            const operation = {
              __aliasFor: createOperation.name,
              __args: {
                [createOperation.argName]: {
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
              [`${createOperation.name}_${dromoImportMetadata.importIdentifier}__${chunkIndex + 1}_${index + 1}`.replace(
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

const generateExampleFieldData = (
  { type, enumValues }: NormalizedObjectField,
  rowNum: number,
): string | number | boolean | EnumType | string[] | null => {
  const now = dayjs();
  const examples: Record<
    NormalizedObjectFieldType,
    (string | number | boolean | EnumType | string[] | null)[]
  > = {
    string: ["example"],
    int: [10, -5],
    float: [1.2, 20.23, 0.2],
    boolean: [true, false],
    enum: enumValues as string[],
    url: ["http://example.com", "https://example.com"],
    date: [
      parseInputFieldValue(now.format("YYYY-MM-DD"), type),
      parseInputFieldValue("2011-02-02", type),
    ],
    datetime: [
      parseInputFieldValue(now.toISOString(), type),
      parseInputFieldValue("2023-03-06T11:12:05Z", type),
    ],
    time: [
      parseInputFieldValue(now.format("HH:mm:ss"), "time"),
      "14:04",
      "10:30:11",
    ],
    timestamp: [
      parseInputFieldValue(now.unix(), "timestamp"),
      parseInputFieldValue("1678101125", "timestamp"),
    ],
    email: ["customer@email.com", "mail@email.co.uk"],
    ipaddress: ["0.0.0.0", "9.255.255.255", "21DA:D3:0:2F3B:2AA:FF:FE28:9C5A"],
    json: [],
    phone: ["+447975777666", "+12025886500"],
  };

  return examples[type]?.[rowNum] !== "" &&
    examples[type]?.[rowNum] !== undefined
    ? examples[type]?.[rowNum]
    : "";
};

export const generateExampleCSV = (
  objectMeta: SkylarkObjectMeta | null,
  dimensions?: ParsedSkylarkDimensionsWithValues[],
): string | null => {
  if (!objectMeta) {
    return null;
  }

  const inputs = objectMeta.operations.create.inputs.filter(
    ({ name }) => !TEMPLATE_FIELDS_TO_IGNORE.includes(name),
  );

  if (!inputs || inputs.length === 0) {
    return null;
  }

  const columns = inputs.map(({ name, isRequired }) =>
    isRequired ? `${name} (required)` : name,
  );

  if (objectMeta.hasRelationships) {
    const relationshipNames = objectMeta.relationships
      .map(({ relationshipName }) => [
        `${relationshipName} (1)`,
        `${relationshipName} (2)`,
        `${relationshipName} (3)`,
      ])
      .flatMap((arr) => arr);
    columns.push(...relationshipNames);
  }

  const dimensionColumns = [];
  if (objectMeta.name === BuiltInSkylarkObjectType.Availability) {
    if (!dimensions) {
      return null;
    }

    const dCols = dimensions
      .map(({ title, slug, external_id, uid, values }) =>
        values.map(
          (_, i) => `${title || slug || external_id || uid} (${i + 1})`,
        ),
      )
      .flatMap((arr) => arr);

    columns.push(...dCols);
    dimensionColumns.push(...dCols);
  }

  const joinedColumns = columns.join(",");

  const blankRow = inputs.length > 1 ? ",".repeat(inputs.length - 1) : ",";

  const exampleRows: string[] = [];

  let exampleRowNum = 0;
  while (
    exampleRows[exampleRows.length - 1] !== blankRow &&
    exampleRows[exampleRows.length - 1] !== ""
  ) {
    const examples = inputs.map((input) =>
      generateExampleFieldData(input, exampleRowNum),
    );

    if (
      exampleRowNum < 2 &&
      objectMeta.name === BuiltInSkylarkObjectType.Availability &&
      dimensions &&
      dimensionColumns.length > 0
    ) {
      dimensions.forEach(({ values }) => {
        const exampleValues = values.map(
          (val) => val.title || val.slug || val.external_id || val.uid,
        );
        examples.push(...exampleValues);
      });
    }

    exampleRowNum += 1;
    exampleRows.push(examples.join(","));
  }

  const csv = [joinedColumns, ...exampleRows].join("\n");
  return csv;
};
