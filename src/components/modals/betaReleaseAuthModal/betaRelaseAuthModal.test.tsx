import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

beforeEach(() => {
  jest.useFakeTimers();
});

test("renders as closed", () => {
  render(<AddAuthTokenModal isOpen={false} setIsOpen={jest.fn()} />);

  expect(screen.queryByText("Connect to Skylark")).toBeNull();
});

test("renders as open", async () => {
  render(<AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />);

  expect(screen.getByText("Connect to Skylark")).toBeInTheDocument();
  expect(screen.getByLabelText("GraphQL URL")).toBeInTheDocument();
  expect(screen.getByLabelText("API Key")).toBeInTheDocument();
});

test("renders as open and closes on the esc key", () => {
  const setIsOpen = jest.fn();

  render(<AddAuthTokenModal isOpen={true} setIsOpen={setIsOpen} />);

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

  render(<AddAuthTokenModal isOpen={true} setIsOpen={setIsOpen} />);

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

  jest.spyOn(navigator.clipboard, "writeText");

  render(<AddAuthTokenModal isOpen={true} setIsOpen={setIsOpen} />);

  const header = screen.getByText("Connect to Skylark");

  expect(header).toBeInTheDocument();

  const uriInput = screen.getByLabelText("GraphQL URL");
  const tokenInput = screen.getByLabelText("API Key");

  fireEvent.change(uriInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "token" },
  });

  const copyToken = screen.getByLabelText(
    "Copy http://invalidgraphqlurl.com to clipboard",
  );
  fireEvent.click(copyToken);

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    "http://invalidgraphqlurl.com",
  );
});

test("changes input to red when they are invalid", async () => {
  server.use(
    graphql.query(GET_SKYLARK_OBJECT_TYPES, (req, res, ctx) => {
      return res(
        ctx.errors([
          {
            message: "Not authorized",
          },
        ]),
      );
    }),
  );
  render(<AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />);

  const uriInput = screen.getByLabelText("GraphQL URL");
  const tokenInput = screen.getByLabelText("API Key");

  fireEvent.change(uriInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });
  fireEvent.change(tokenInput, {
    target: { value: "http://invalidgraphqlurl.com" },
  });

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  await waitFor(() => expect(uriInput).toHaveClass("border-error"));
  await waitFor(() => expect(tokenInput).toHaveClass("border-error"));
  expect(screen.getByText("Connect").closest("button")).toBeDisabled();
});

test("changes input to green when they are valid", async () => {
  render(<AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />);

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

  render(<AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />);

  const uriInput = screen.getByLabelText("GraphQL URL");
  const tokenInput = screen.getByLabelText("API Key");

  await fireEvent.change(uriInput, {
    target: { value: "http://valid.com" },
  });
  await fireEvent.change(tokenInput, {
    target: { value: "token" },
  });

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  const connect = screen.getByRole("button", {
    name: "Validating",
  });

  await waitFor(() => expect(connect).not.toBeDisabled());

  fireEvent.click(connect);

  expect(setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.auth.active,
    JSON.stringify({ uri: "http://valid.com", token: "token" }),
  );
});

test("shows the user's account when connected", async () => {
  render(<AddAuthTokenModal isOpen={true} setIsOpen={jest.fn()} />);

  await waitFor(() => {
    expect(screen.getByText("Currently connected to:")).toBeInTheDocument();
  });

  expect(screen.getByText("kxa3cpoawbcdpfkz3gusojkg3u")).toBeInTheDocument();
});
