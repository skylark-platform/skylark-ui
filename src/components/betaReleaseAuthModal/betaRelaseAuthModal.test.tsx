import { ApolloProvider } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMockClient, MockApolloClient } from "mock-apollo-client";

import { LOCAL_STORAGE } from "src/constants/skylark";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";
import { pause } from "src/lib/utils";
import { GQLSkylarkObjectTypesQueryFixture } from "src/tests/fixtures";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

let mockClient: MockApolloClient;

jest.mock("../../lib/graphql/skylark/client", () => ({
  // ...jest.requireActual("../../lib/graphql/skylark/client"),
  createSkylarkClient: () => mockClient,
  createBasicSkylarkClient: () => mockClient,
  __esModule: true,
}));

beforeEach(() => {
  mockClient = createMockClient();

  // IntersectionObserver isn't available in test environment
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
});

test("renders as closed", async () => {
  render(
    <MockedProvider mocks={[]}>
      <AddAuthTokenModal isOpen={false} setIsOpen={jest.fn()} />
    </MockedProvider>,
  );

  expect(screen.queryByText("Connect to Skylark")).toBeNull();
});

test("renders as open", async () => {
  render(
    <MockedProvider mocks={[]}>
      <AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />
    </MockedProvider>,
  );

  expect(screen.getByText("Connect to Skylark")).toBeInTheDocument();
  expect(screen.getByLabelText("Skylark URI")).toBeInTheDocument();
  expect(screen.getByLabelText("Access Token")).toBeInTheDocument();
  expect(screen.getByRole("button")).toBeDisabled();
});

test("changes input to red when they are invalid", async () => {
  mockClient.setRequestHandler(GET_SKYLARK_OBJECT_TYPES, () =>
    Promise.reject(new Error("An error occurred")),
  );
  render(
    <ApolloProvider client={mockClient}>
      <AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />
    </ApolloProvider>,
  );

  const uriInput = screen.getByLabelText("Skylark URI");
  const tokenInput = screen.getByLabelText("Access Token");

  fireEvent.change(uriInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });

  await waitFor(() => expect(uriInput).toHaveClass("border-error"));
  await waitFor(() => expect(tokenInput).toHaveClass("border-error"));
  expect(screen.getByRole("button")).toBeDisabled();
});

test("changes input to green when they are valid", async () => {
  mockClient.setRequestHandler(GET_SKYLARK_OBJECT_TYPES, () =>
    Promise.resolve(GQLSkylarkObjectTypesQueryFixture),
  );
  render(
    <ApolloProvider client={mockClient}>
      <AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />
    </ApolloProvider>,
  );

  const uriInput = screen.getByLabelText("Skylark URI");
  const tokenInput = screen.getByLabelText("Access Token");

  fireEvent.change(uriInput, {
    target: { value: "http://valid.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "token" },
  });

  await waitFor(() => expect(uriInput).toHaveClass("border-success"));
  await waitFor(() => expect(tokenInput).toHaveClass("border-success"));
  await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
});

test("when GraphQL is valid, updates local storage", async () => {
  const setItem = jest.spyOn(Storage.prototype, "setItem");

  mockClient.setRequestHandler(GET_SKYLARK_OBJECT_TYPES, () =>
    Promise.resolve(GQLSkylarkObjectTypesQueryFixture),
  );
  render(
    <ApolloProvider client={mockClient}>
      <AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />
    </ApolloProvider>,
  );

  const uriInput = screen.getByLabelText("Skylark URI");
  const tokenInput = screen.getByLabelText("Access Token");

  fireEvent.change(uriInput, {
    target: { value: "http://valid.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "token" },
  });

  const connect = screen.getByRole("button");

  await waitFor(() => expect(connect).not.toBeDisabled());

  fireEvent.click(connect);

  expect(setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.betaAuth.uri,
    "http://valid.com",
  );
  expect(setItem).toHaveBeenCalledWith(LOCAL_STORAGE.betaAuth.token, "token");
});
