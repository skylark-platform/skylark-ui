import {
  ApolloClient,
  ApolloLink,
  defaultDataIdFromObject,
  execute,
} from "@apollo/client";

import {
  authLink,
  createApolloClientDataIdFromSkylarkObject,
  createBasicSkylarkClient,
  createSkylarkClient,
} from "./client";
import { GET_SKYLARK_OBJECT_TYPES } from "./queries";

jest.mock("@apollo/client", () => ({
  ...jest.requireActual("@apollo/client"),
  defaultDataIdFromObject: jest.fn(),
  ApolloClient: jest.fn(),
}));
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

  expect(ApolloClient).toHaveBeenCalled();
});

test("creates a basic client with the uri and token passed", () => {
  createBasicSkylarkClient("uri", "token");

  expect(ApolloClient).toHaveBeenCalledWith({
    cache: expect.any(Object),
    headers: {
      "x-api-key": "token",
    },
    uri: "uri",
  });
});
