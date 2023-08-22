import { graphql } from "msw";

import GQLSkylarkAllAvailTestMovieFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkAllAvailTestMovieSearchFixture from "src/__tests__/fixtures/skylark/queries/search/fantasticMrFox_All_Availabilities.json";
import GQLGameOfThronesSearchResults from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import { server } from "src/__tests__/mocks/server";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";
import { GQLSkylarkAccountResponse } from "src/interfaces/skylark";

import { ContentLibrary } from "./contentLibrary.component";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  jest.useFakeTimers();

  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

test("open metadata panel, check information and close", async () => {
  render(<ContentLibrary />);

  await waitFor(() => {
    expect(screen.getByTestId("object-search-results")).toBeInTheDocument();
  });

  const input = screen.getByPlaceholderText("Search for an object(s)");
  fireEvent.change(input, { target: { value: "AllAvailTestMovie" } });

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  await screen.findAllByText(
    GQLSkylarkAllAvailTestMovieFixture.data.getObject.title,
  );

  fireEvent.mouseEnter(
    screen.getByText(GQLSkylarkAllAvailTestMovieFixture.data.getObject.title),
  );

  const infoButton = screen.getAllByRole("button", {
    name: /object-info/i,
  });

  fireEvent.click(infoButton[0]);

  await waitFor(() =>
    expect(screen.getByTestId("drag-bar")).toBeInTheDocument(),
  );

  await waitFor(() =>
    expect(screen.getByTestId("panel-header")).toBeInTheDocument(),
  );

  await waitFor(() =>
    expect(screen.getByTestId("panel-metadata")).toBeInTheDocument(),
  );

  const panelHeader = screen.getByTestId("panel-header");
  await waitFor(() =>
    expect(
      within(panelHeader).getByText(
        GQLSkylarkAllAvailTestMovieFixture.data.getObject.title,
      ),
    ).toBeInTheDocument(),
  );

  await waitFor(() => expect(screen.getByText("Close")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Close"));

  await waitFor(() =>
    expect(screen.queryByTestId("panel-header")).not.toBeInTheDocument(),
  );
}, 10000);

test("displays the number of search results", async () => {
  server.use(
    // Override GET_USER_AND_ACCOUNT query so the language sent is null
    graphql.query("GET_USER_AND_ACCOUNT", (req, res, ctx) => {
      const data: GQLSkylarkAccountResponse = {
        getAccount: {
          config: null,
          account_id: "123",
          skylark_version: "latest",
        },
      };
      return res(ctx.data(data));
    }),
  );

  render(<ContentLibrary />);

  await waitFor(() =>
    expect(
      screen.getByText(
        `${GQLGameOfThronesSearchResults.data.search.total_count} results`,
      ),
    ).toBeInTheDocument(),
  );

  const input = screen.getByPlaceholderText("Search for an object(s)");
  fireEvent.change(input, { target: { value: "AllAvailTestMovie" } });

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  await waitFor(() =>
    expect(
      screen.getByText(
        `${GQLSkylarkAllAvailTestMovieSearchFixture.data.search.total_count} results`,
      ),
    ).toBeInTheDocument(),
  );
}, 10000);
