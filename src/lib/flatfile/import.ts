import { gql } from "@apollo/client";
import { ITheme } from "@flatfile/sdk";
import { jsonToGraphQLQuery } from "json-to-graphql-query";
import { FlatfileRow } from "src/interfaces/flatfile/responses";

import { SkylarkClient } from "../graphql/skylark/client";
import { getSkylarkObjectInputFields } from "../skylark/introspection";

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

  Flatfile.requestDataFromUser({
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
): Promise<any> => {
  const method = `create${objectType}`;
  const mutationPrefix = `${method}_${flatfileBatchId}`.replaceAll("-", "_");

  const inputFields = await getSkylarkObjectInputFields(client, objectType);

  const dateProperties = inputFields
    .filter((property) => property.type.name === "AWSDateTime")
    .map((property) => property.name);

  const operations = flatfileRows.reduce((previousOperations, { id, data }) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) =>
          value != null && !(dateProperties.includes(key) && value === ""),
      ),
    );

    const operation = {
      __aliasFor: method,
      __args: {
        [objectType.toLowerCase()]: filteredData,
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

  const graphQLMutation = jsonToGraphQLQuery(mutation);

  const { data } = await client.mutate<{
    [key: string]: { uid: string; external_id: string };
  }>({ mutation: gql(graphQLMutation) });

  return data;
};
