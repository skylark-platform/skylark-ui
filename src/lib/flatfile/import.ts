import { gql } from "@apollo/client";
import { ITheme } from "@flatfile/sdk";
import dayjs from "dayjs";
import { EnumType, jsonToGraphQLQuery } from "json-to-graphql-query";

import {
  FlatfileObjectsCreatedInSkylark,
  FlatfileRow,
} from "src/interfaces/flatfile/responses";
import {
  SkylarkImportedObject,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { SkylarkClient } from "src/lib/graphql/skylark/client";
import { getSkylarkObjectOperations } from "src/lib/skylark/introspection/introspection";

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
  client: SkylarkClient,
  objectType: string,
  flatfileBatchId: string,
  allFlatfileRows: FlatfileRow[],
): Promise<{ data: SkylarkImportedObject[]; errors: any[] }> => {
  const skylarkObjectOperations: SkylarkObjectMeta["operations"] =
    await getSkylarkObjectOperations(client, objectType);

  const mutationPrefix =
    `${skylarkObjectOperations.create.name}_${flatfileBatchId}`.replace(
      /-/g,
      "_",
    );

  const chunkedFlatfileRows = chunkArray(allFlatfileRows, 50);

  const dataArr = await Promise.all(
    chunkedFlatfileRows.map(async (flatfileRows) => {
      const operations = flatfileRows.reduce(
        (previousOperations, { id, data }) => {
          const keyValuePairs = Object.entries(data)
            .map(([key, value]) => {
              if (value === null || value === "") {
                // Empty strings will not work with AWSDateTime, or AWSURL so don't send them
                return null;
              }

              const input = skylarkObjectOperations.create.inputs.find(
                (createInput) => createInput.name === key,
              );
              if (input?.type === "enum") {
                return [key, new EnumType(value as string)];
              }
              if (input?.type === "datetime") {
                return [key, dayjs(value as string).toISOString()];
              }
              if (input?.type === "date") {
                return [key, dayjs(value as string).format("YYYY-MM-DDZ")];
              }
              if (input?.type === "time") {
                return [key, dayjs(value as string).format("HH:mm:ss.SSSZ")];
              }
              if (input?.type === "int") {
                return [key, parseInt(value as string)];
              }
              if (input?.type === "float") {
                return [key, parseFloat(value as string)];
              }
              return [key, value];
            })
            .filter((value) => value !== null) as [string, string | EnumType][];

          const parsedData = Object.fromEntries(keyValuePairs);

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
            [`${mutationPrefix}_${id}`]: {
              ...operation,
            },
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
        const response = await client.mutate<FlatfileObjectsCreatedInSkylark>({
          mutation: gql(graphQLMutation),
        });
        const data = Object.values(
          response.data as FlatfileObjectsCreatedInSkylark,
        );
        return { error: undefined, data };
      } catch (err) {
        return { error: err, data: [] };
      }
    }),
  );

  const data = dataArr.flatMap(({ data }) => data);
  const errors = dataArr
    .flatMap(({ error }) => error)
    .filter((error) => !!error);

  return {
    data,
    errors,
  };
};
