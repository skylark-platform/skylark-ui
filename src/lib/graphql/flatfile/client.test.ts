import { GraphQLClient } from "graphql-request";

import { createFlatfileClient } from "./client";

jest.mock("graphql-request");
jest.mock("../../../constants/flatfile", () => ({
  FLATFILE_GRAPHQL_URL: "https://flatfile",
  __esModule: true,
}));

test("creates a new GraphQLClient", () => {
  createFlatfileClient("token");

  expect(GraphQLClient).toHaveBeenCalledWith("https://flatfile", {
    headers: {
      Authorization: "Bearer token",
    },
  });
});
