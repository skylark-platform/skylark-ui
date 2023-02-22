import { ITheme } from "@flatfile/sdk";
import { gql } from "graphql-tag";
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
  flatfileRows: FlatfileRow[],
): Promise<SkylarkImportedObject[]> => {
  const skylarkObjectOperations: SkylarkObjectMeta["operations"] =
    await getSkylarkObjectOperations(client, objectType);

  const mutationPrefix =
    `${skylarkObjectOperations.create.name}_${flatfileBatchId}`.replace(
      /-/g,
      "_",
    );

  const operations = flatfileRows.reduce((previousOperations, { id, data }) => {
    const parsedData = Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => {
          const input = skylarkObjectOperations.create.inputs.find(
            (createInput) => createInput.name === key,
          );
          if (input?.type === "enum") {
            return [key, new EnumType(value as string)];
          }
          return [key, value];
        }),
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
      [`${mutationPrefix}_${id}`]: {
        ...operation,
      },
    };
    return updatedOperations;
  }, {} as { [key: string]: object });

  const mutation = {
    mutation: {
      __name: mutationPrefix,
      ...operations,
    },
  };

  const graphQLMutation = jsonToGraphQLQuery(mutation, { pretty: true });

  const response = await client.mutate<FlatfileObjectsCreatedInSkylark>({
    mutation: gql(graphQLMutation),
  });

  return Object.values(response.data as FlatfileObjectsCreatedInSkylark);
};
