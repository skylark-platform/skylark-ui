import { GraphQLClient } from "graphql-request";

import { FLATFILE_GRAPHQL_URL } from "src/constants/flatfile";

export const createFlatfileClient = (token: string) =>
  new GraphQLClient(FLATFILE_GRAPHQL_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export type FlatfileClient = ReturnType<typeof createFlatfileClient>;
