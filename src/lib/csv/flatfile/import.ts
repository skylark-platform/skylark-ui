import { ITheme } from "@flatfile/sdk/dist/types";
import { GraphQLClient } from "graphql-request";

import {
  FlatfileObjectsCreatedInSkylark,
  FlatfileObjectsCreatedInSkylarkFields,
  FlatfileRow,
} from "src/interfaces/flatfile/responses";
import {
  GQLSkylarkError,
  GQLSkylarkErrorResponse,
  SkylarkImportedObject,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";
import { getSkylarkObjectOperations } from "src/lib/skylark/introspection/introspection";
import { parseMetadataForGraphQLRequest } from "src/lib/skylark/parsers";
import { chunkArray, hasProperty } from "src/lib/utils";

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
