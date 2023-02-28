import { ApolloClient, defaultDataIdFromObject } from "@apollo/client";

import { REQUEST_HEADERS } from "src/constants/skylark";

import {
  createApolloClientDataIdFromSkylarkObject,
  createBasicSkylarkClient,
  createSkylarkClient,
} from "./client";

jest.mock("@apollo/client", () => ({
  ...jest.requireActual("@apollo/client"),
  defaultDataIdFromObject: jest.fn(),
  ApolloClient: jest.fn(),
}));
jest.mock("../../../constants/skylark", () => ({
  SAAS_API_ENDPOINT: "endpoint",
  SAAS_API_KEY: "api-key",
  ...jest.requireActual("../../../constants/skylark"),
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

  expect(ApolloClient).toHaveBeenCalled();
});

test("creates a basic client with the uri and token passed", () => {
  createBasicSkylarkClient("uri", "token");

  expect(ApolloClient).toHaveBeenCalledWith({
    cache: expect.any(Object),
    headers: {
      [REQUEST_HEADERS.apiKey]: "token",
    },
    uri: "uri",
  });
});
