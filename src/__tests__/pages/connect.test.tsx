import { render, screen, waitFor } from "src/__tests__/utils/test-utils";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import ConnectPage from "src/pages/connect";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

test("displays help text when URI or API Key not given", () => {
  const router = { push: jest.fn(), query: { uri: "sfsdf" } };
  useRouter.mockReturnValue(router);

  render(<ConnectPage />);

  expect(
    screen.getByText(
      "Enter your Skylark URI and API Key into the URL to auto connect.",
    ),
  ).toBeInTheDocument();
  expect(router.push).not.toHaveBeenCalled();
});

test("updates localStorage when URI and API key are given", async () => {
  const uri = "skylark.com/graphql";
  const token = "da2-asfsdf";
  const router = { push: jest.fn(), query: { uri, apikey: token } };
  useRouter.mockReturnValue(router);
  Storage.prototype.setItem = jest.fn();

  await render(<ConnectPage />);

  expect(screen.getByText("URI and API Key found in URL.")).toBeInTheDocument();

  await waitFor(() => {
    expect(localStorage.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE.auth.active,
      JSON.stringify({ uri, token }),
    );
  });

  expect(localStorage.setItem).toHaveBeenCalledTimes(1);

  expect(router.push).toHaveBeenCalledWith("/");
});

test("decrypts and updates localStorage when a token is given", async () => {
  const uri = "skylark.com/graphql";
  const token = "da2-asfsdf";
  const router = {
    push: jest.fn(),
    query: { token: btoa(`${uri}__${token}`) },
  };
  useRouter.mockReturnValue(router);
  Storage.prototype.setItem = jest.fn();

  await render(<ConnectPage />);

  await waitFor(() => {
    expect(localStorage.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE.auth.active,
      JSON.stringify({ uri, token }),
    );
  });

  expect(localStorage.setItem).toHaveBeenCalledTimes(1);

  expect(router.push).toHaveBeenCalledWith("/");
});
