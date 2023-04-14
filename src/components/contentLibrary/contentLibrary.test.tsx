import GQLSkylarkAllAvailTestMovieFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkAllAvailTestMovieSearchFixture from "src/__tests__/fixtures/skylark/queries/search/fantasticMrFox_All_Availabilities.json";
import GQLGameOfThronesSearchResults from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";

import { ContentLibrary } from "./contentLibrary.component";

beforeEach(() => {
  jest.useFakeTimers();
});

test("open metadata panel, check information and close", async () => {
  render(<ContentLibrary />);

  const input = screen.getByPlaceholderText("Search for an object(s)");
  fireEvent.change(input, { target: { value: "AllAvailTestMovie" } });

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  await screen.findAllByRole("button", {
    name: /object-info/i,
  });

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
  expect(
    within(panelHeader).getByText(
      GQLSkylarkAllAvailTestMovieFixture.data.getObject.title,
    ),
  ).toBeInTheDocument();

  await waitFor(() => expect(screen.getByText("Close")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Close"));

  await waitFor(() =>
    expect(screen.queryByTestId("panel-header")).not.toBeInTheDocument(),
  );
});

test("displays the number of search results", async () => {
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
});
