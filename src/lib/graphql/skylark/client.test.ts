import { ApolloClient, defaultDataIdFromObject } from "@apollo/client";

import {
  createApolloClientDataIdFromSkylarkObject,
  createSkylarkClient,
} from "./client";

jest.mock("@apollo/client");
jest.mock("../../../constants/skylark", () => ({
  SAAS_API_ENDPOINT: "endpoint",
  SAAS_API_KEY: "api-key",
  __esModule: true,
}));

test("createApolloClientDataIdFromSkylarkObject with uid", () => {
  const got = createApolloClientDataIdFromSkylarkObject({
    __typename: "Episode",
    uid: "xxxxx",
  });
  expect(got).toEqual("Episode:xxxxx");
});

test("createApolloClientDataIdFromSkylarkObject without uid defaults to defaultDataIdFromObject", () => {
  const input = {
    __typename: "Other",
    _id: 123,
    id: 123,
  };
  createApolloClientDataIdFromSkylarkObject(input);
  expect(defaultDataIdFromObject).toHaveBeenCalledWith(input);
});

test("creates a new ApolloClient", () => {
  createSkylarkClient();

  expect(ApolloClient).toHaveBeenCalledWith({
    cache: expect.any(Object),
    headers: {
      "x-api-key": "api-key",
    },
    uri: "endpoint",
  });
});
