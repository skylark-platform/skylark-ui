import GQLGameOfThronesSearchResultsPage1 from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";

import { ObjectList } from "./objectListing.component";

test("renders search bar, filters with no objects returned", () => {
  render(<ObjectList />);

  screen.findByPlaceholderText("Search for an object(s)");

  expect(screen.getByText("Filters")).toBeInTheDocument();
});

test("renders create button", () => {
  render(<ObjectList withCreateButtons onInfoClick={jest.fn()} />);

  const createButton = screen.getByText("Create");

  fireEvent.click(createButton);

  expect(screen.getByText("Import (CSV)")).toBeInTheDocument();
});

test("does not render info button when onInfoClick is undefined", async () => {
  render(<ObjectList onInfoClick={undefined} />);

  expect(
    await screen.queryByRole("button", {
      name: /object-info/i,
    }),
  ).not.toBeInTheDocument();
});

test("renders row select checkboxes", async () => {
  render(<ObjectList withObjectSelect />);

  await waitFor(() =>
    expect(
      screen.getByRole("checkbox", { name: "toggle-select-all-objects" }),
    ).toBeInTheDocument(),
  );
});

test("renders search results", async () => {
  render(<ObjectList />);

  await screen.findByText("UID"); // Search for table header
  // Search for table content
  await screen.findAllByText(
    GQLGameOfThronesSearchResultsPage1.data.search.objects[0].uid,
  );

  expect(
    screen.getByText(
      GQLGameOfThronesSearchResultsPage1.data.search.objects[0].uid as string,
    ),
  ).toBeInTheDocument();
});

test("opens filters and deselects all object types", async () => {
  render(<ObjectList />);

  await screen.findByText("UID");

  fireEvent.click(
    screen.getByRole("button", {
      name: /open-search-filters/i,
    }),
  );

  await waitFor(() => {
    expect(screen.getByText("Object type")).toBeInTheDocument();
  });

  expect(screen.getAllByRole("checkbox")[0]).toHaveAttribute(
    "id",
    "checkbox-toggle-all-object-type",
  );

  await fireEvent.click(screen.getAllByRole("checkbox")[0]);

  expect(screen.getByLabelText("Episode")).toBeInTheDocument();
});

describe("row in edit mode", () => {
  test("save/cancel icon appears", async () => {
    render(<ObjectList withObjectEdit onInfoClick={jest.fn()} />);

    await screen.findByText("UID"); // Search for table header

    await screen.findAllByRole("button", {
      name: /object-info/i,
    });

    await fireEvent.click(
      screen.getAllByRole("button", {
        name: /object-edit/i,
      })[0],
    );

    expect(
      screen.getByRole("button", {
        name: /object-edit-save/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /object-edit-cancel/i,
      }),
    ).toBeInTheDocument();
  });

  test("row turns into inputs", async () => {
    render(<ObjectList withObjectEdit onInfoClick={jest.fn()} />);

    await screen.findByText("UID"); // Search for table header

    await screen.findAllByRole("button", {
      name: /object-info/i,
    });

    await fireEvent.click(
      screen.getAllByRole("button", {
        name: /object-edit/i,
      })[0],
    );

    expect(
      screen.getByDisplayValue(
        GQLGameOfThronesSearchResultsPage1.data.search.objects[0].uid,
      ),
    ).toHaveAttribute("disabled");
  });
});
