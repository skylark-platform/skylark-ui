import { ApolloClient } from "@apollo/client";

import { createSkylarkClient } from "./client";

jest.mock("@apollo/client");
jest.mock("../../../constants/skylark", () => ({
  SAAS_API_ENDPOINT: "endpoint",
  SAAS_API_KEY: "api-key",
  SAAS_ACCOUNT_ID: "account-id",
  __esModule: true,
}));

test("creates a new ApolloClient", () => {
  createSkylarkClient();

  expect(ApolloClient).toHaveBeenCalledWith({
    cache: expect.any(Object),
    headers: {
      "x-account-id": "account-id",
      "x-api-key": "api-key",
    },
    uri: "endpoint",
  });
});
