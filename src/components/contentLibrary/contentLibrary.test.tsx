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
    within(panelHeader).getByText("All Avail Test Movie"),
  ).toBeInTheDocument();

  await waitFor(() => expect(screen.getByText("Close")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Close"));

  await waitFor(() =>
    expect(screen.queryByTestId("panel-header")).not.toBeInTheDocument(),
  );
});
