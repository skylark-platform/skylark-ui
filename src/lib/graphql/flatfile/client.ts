import { ApolloClient, InMemoryCache } from "@apollo/client";
import { FLATFILE_GRAPHQL_URL } from "src/constants/flatfile";

export const createFlatfileClient = (token: string) =>
  new ApolloClient({
    uri: FLATFILE_GRAPHQL_URL,
    cache: new InMemoryCache(),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export type FlatfileClient = ReturnType<typeof createFlatfileClient>;
