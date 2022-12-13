import { ApolloClient } from "@apollo/client";

import { createFlatfileClient } from "./client";

jest.mock("@apollo/client");
jest.mock("../../../constants/flatfile", () => ({
  FLATFILE_GRAPHQL_URL: "https://flatfile",
  __esModule: true,
}));

test("creates a new ApolloClient", () => {
  createFlatfileClient("token");

  expect(ApolloClient).toHaveBeenCalledWith({
    cache: expect.any(Object),
    uri: "https://flatfile",
    headers: {
      Authorization: "Bearer token",
    },
  });
});
