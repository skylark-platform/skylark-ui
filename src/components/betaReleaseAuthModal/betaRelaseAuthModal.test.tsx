import { ApolloProvider } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMockClient, MockApolloClient } from "mock-apollo-client";

import { LOCAL_STORAGE } from "src/constants/skylark";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";
import GQLSkylarkObjectTypesQueryFixture from "src/tests/fixtures/skylark/queries/introspection/objectTypes.json";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

let mockClient: MockApolloClient;

jest.mock("../../lib/graphql/skylark/client", () => ({
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

test("renders as closed", () => {
  render(
    <MockedProvider mocks={[]}>
      <AddAuthTokenModal isOpen={false} setIsOpen={jest.fn()} />
    </MockedProvider>,
  );

  expect(screen.queryByText("Connect to Skylark")).toBeNull();
});

test("renders as open", () => {
  render(
    <MockedProvider mocks={[]}>
      <AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />
    </MockedProvider>,
  );

  expect(screen.getByText("Connect to Skylark")).toBeInTheDocument();
  expect(screen.getByLabelText("GraphQL URL")).toBeInTheDocument();
  expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  expect(screen.getByText("Validating").closest("button")).toBeDisabled();
});

test("renders as open and closes on the esc key", () => {
  const setIsOpen = jest.fn();

  render(
    <MockedProvider mocks={[]}>
      <AddAuthTokenModal isOpen={true} setIsOpen={setIsOpen} />
    </MockedProvider>,
  );

  const header = screen.getByText("Connect to Skylark");

  expect(header).toBeInTheDocument();

  fireEvent.keyDown(header, {
    key: "Escape",
    code: "Escape",
    keyCode: 27,
    charCode: 27,
  });

  expect(setIsOpen).toHaveBeenCalledWith(false);
});

test("renders and close with close button", () => {
  const setIsOpen = jest.fn();

  render(
    <MockedProvider mocks={[]}>
      <AddAuthTokenModal isOpen={true} setIsOpen={setIsOpen} />
    </MockedProvider>,
  );

  const header = screen.getByText("Connect to Skylark");

  expect(header).toBeInTheDocument();
  const close = screen.getByRole("button", {
    name: "close",
  });
  fireEvent.click(close);
  expect(setIsOpen).toHaveBeenCalledWith(false);
});

test("clicks the copy buttons", () => {
  const setIsOpen = jest.fn();
  Object.assign(navigator, {
    clipboard: {
      writeText: () => {
        return;
      },
    },
  });

  jest.spyOn(navigator.clipboard, "writeText");

  render(
    <MockedProvider mocks={[]}>
      <AddAuthTokenModal isOpen={true} setIsOpen={setIsOpen} />
    </MockedProvider>,
  );

  const header = screen.getByText("Connect to Skylark");

  expect(header).toBeInTheDocument();

  const uriInput = screen.getByLabelText("GraphQL URL");
  const tokenInput = screen.getByLabelText("API Key");

  fireEvent.change(uriInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });

  const copyToken = screen.getByLabelText("Copy API Key to clipboard");
  fireEvent.click(copyToken);

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    "http://invalidgraphqlurl.com",
  );
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

  const uriInput = screen.getByLabelText("GraphQL URL");
  const tokenInput = screen.getByLabelText("API Key");

  fireEvent.change(uriInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });

  await waitFor(() => expect(uriInput).toHaveClass("border-error"));
  await waitFor(() => expect(tokenInput).toHaveClass("border-error"));
  expect(screen.getByText("Connect").closest("button")).toBeDisabled();
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

  const uriInput = screen.getByLabelText("GraphQL URL");
  const tokenInput = screen.getByLabelText("API Key");

  fireEvent.change(uriInput, {
    target: { value: "http://valid.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "token" },
  });

  await waitFor(() => expect(uriInput).toHaveClass("border-success"));
  await waitFor(() => expect(tokenInput).toHaveClass("border-success"));
  await waitFor(() =>
    expect(screen.getByText("Connect").closest("button")).not.toBeDisabled(),
  );
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

  const uriInput = screen.getByLabelText("GraphQL URL");
  const tokenInput = screen.getByLabelText("API Key");

  fireEvent.change(uriInput, {
    target: { value: "http://valid.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "token" },
  });

  const connect = screen.getByRole("button", {
    name: "Validating",
  });

  await waitFor(() => expect(connect).not.toBeDisabled());

  fireEvent.click(connect);

  expect(setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.betaAuth.uri,
    "http://valid.com",
  );
  expect(setItem).toHaveBeenCalledWith(LOCAL_STORAGE.betaAuth.token, "token");
});
