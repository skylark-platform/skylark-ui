import { ITheme } from "@flatfile/sdk/dist/types";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { GraphQLClient } from "graphql-request";
import { EnumType, jsonToGraphQLQuery } from "json-to-graphql-query";

import { TEMPLATE_FIELDS_TO_IGNORE } from "src/constants/flatfile";
import {
  FlatfileObjectsCreatedInSkylark,
  FlatfileObjectsCreatedInSkylarkFields,
  FlatfileRow,
} from "src/interfaces/flatfile/responses";
import {
  GQLSkylarkError,
  GQLSkylarkErrorResponse,
  NormalizedObjectField,
  NormalizedObjectFieldType,
  SkylarkImportedObject,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { getSkylarkObjectOperations } from "src/lib/skylark/introspection/introspection";
import {
  parseInputFieldValue,
  parseMetadataForGraphQLRequest,
} from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

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

  const mutationPrefix =
    `${skylarkObjectOperations.create.name}_${flatfileBatchId}`.replace(
      /-/g,
      "_",
    );

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
              data,
              skylarkObjectOperations.create.inputs,
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
              [`${mutationPrefix}_${id}`]: operation,
            };
            return updatedOperations;
          },
          {} as { [key: string]: object },
        );

        const mutation = {
          mutation: {
            __name: mutationPrefix,
            ...operations,
          },
        };

        const graphQLMutation = jsonToGraphQLQuery(mutation, { pretty: true });

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

export const generateExampleFieldData = (
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
      parseInputFieldValue(now.unix(), type),
      parseInputFieldValue("1678101125", type),
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
): string | null => {
  const inputs = objectMeta?.operations.create.inputs.filter(
    ({ name }) => !TEMPLATE_FIELDS_TO_IGNORE.includes(name),
  );

  if (!inputs || inputs.length === 0) {
    return null;
  }

  const columns = inputs
    .map(({ name, isRequired }) => (isRequired ? `${name} (required)` : name))
    .join(",");
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
    exampleRowNum += 1;
    exampleRows.push(examples.join(","));
  }

  const csv = [columns, ...exampleRows].join("\n");
  return csv;
};
