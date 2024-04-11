import { FlatfileGetFinalDatabaseViewResponse } from "src/interfaces/flatfile/responses";
import { FlatfileClient } from "src/lib/graphql/flatfile/client";
import { GET_FINAL_DATABASE_VIEW } from "src/lib/graphql/flatfile/queries";

export const getFlatfileFinalDatabaseView = async (
  client: FlatfileClient,
  batchId: string,
  limit = 1000,
  offset = 0,
) => {
  const data = await client.request<FlatfileGetFinalDatabaseViewResponse>(
    GET_FINAL_DATABASE_VIEW,
    {
      batchId,
      limit,
      offset,
    },
  );

  return data.getFinalDatabaseView;
};
