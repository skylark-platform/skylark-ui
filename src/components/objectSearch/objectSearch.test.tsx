import { graphql } from "msw";

import GQLGameOfThronesSearchResultsPage1 from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import GQLGameOfThronesSearchResultsPage1enGB from "src/__tests__/fixtures/skylark/queries/search/gotPage1enGB.json";
import { server } from "src/__tests__/mocks/server";
import {
  act,
  fireEvent,
  prettyDOM,
  render,
  screen,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  GQLSkylarkAccountResponse,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";

import { ObjectSearch } from "./objectSearch.component";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

afterEach(() => {
  jest.useRealTimers();
});

test("renders search bar", () => {
  render(<ObjectSearch />);

  screen.findByPlaceholderText("Search for an object(s)");

  expect(screen.getByText("Filters")).toBeInTheDocument();
});

test("renders search bar, filters with no objects returned", async () => {
  jest.useFakeTimers();

  render(<ObjectSearch />);

  const input = screen.getByPlaceholderText("Search for an object(s)");
  fireEvent.change(input, { target: { value: "AllAvailTestMovie" } });

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  await screen.findByTestId("object-search-results-content");

  expect(
    (await screen.findAllByText("Fantastic Mr Fox (All Availabilities)"))[0],
  ).toBeInTheDocument();
});

describe("create button", () => {
  test("renders create button", () => {
    render(<ObjectSearch withCreateButtons setPanelObject={jest.fn()} />);

    const createButton = screen.getByText("Create");

    fireEvent.click(createButton);

    const csvImportButton = screen.getByText("Import (CSV)");
    expect(csvImportButton).toBeInTheDocument();
    expect(csvImportButton.closest("a")).toHaveAttribute("href", "import/csv");
  });

  test("opens the create object modal", async () => {
    render(<ObjectSearch withCreateButtons setPanelObject={jest.fn()} />);

    const createButton = screen.getByText("Create");

    fireEvent.click(createButton);

    const createObjectButton = screen.getByText("Create Object");
    expect(createObjectButton).toBeInTheDocument();

    fireEvent.click(createObjectButton);

    await waitFor(() =>
      expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
    );
  });
});

test("renders the info button on row hover when setPanelObject is given", async () => {
  render(<ObjectSearch setPanelObject={() => ""} />);

  await screen.findAllByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
      .__SkylarkSet__title as string,
  );

  fireEvent.mouseEnter(
    screen.getByText(
      GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
        .__SkylarkSet__title as string,
    ),
  );

  expect(
    await screen.queryByRole("button", {
      name: /object-info/i,
    }),
  ).toBeInTheDocument();
});

test("does not render info button on row hover when setPanelObject is undefined", async () => {
  render(<ObjectSearch setPanelObject={undefined} />);

  await screen.findAllByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
      .__SkylarkSet__title as string,
  );

  fireEvent.mouseEnter(
    screen.getByText(
      GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
        .__SkylarkSet__title as string,
    ),
  );

  expect(
    await screen.queryByRole("button", {
      name: /object-info/i,
    }),
  ).not.toBeInTheDocument();
});

describe("with object select (checkboxes)", () => {
  test("renders row select checkboxes", async () => {
    await render(<ObjectSearch withObjectSelect />);

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(0);
  });

  test("fires on rowCheckChange callback when a checkbox is checked", async () => {
    const onRowCheckChange = jest.fn();

    await render(
      <ObjectSearch
        withObjectSelect
        onObjectCheckedChanged={onRowCheckChange}
        checkedObjects={[]}
      />,
    );

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(1);

    const checkbox = (await withinResults.findAllByRole("checkbox"))[1];

    await fireEvent.click(checkbox);

    expect(onRowCheckChange).toHaveBeenLastCalledWith([expect.any(Object)]);
  });

  test("resets the checked rows when the search changes", async () => {
    jest.useFakeTimers();

    const onObjectCheckedChanged = jest.fn();

    await render(
      <ObjectSearch
        withObjectSelect
        onObjectCheckedChanged={onObjectCheckedChanged}
      />,
    );

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(0);

    const input = screen.getByPlaceholderText("Search for an object(s)");
    await fireEvent.change(input, { target: { value: "AllAvailTestMovie" } });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onObjectCheckedChanged).toHaveBeenCalledTimes(3);
    expect(onObjectCheckedChanged).toHaveBeenCalledWith([]);
  });

  test("clears all selected rows using the toggle all", async () => {
    const onRowCheckChange = jest.fn();

    await render(
      <ObjectSearch
        withObjectSelect
        onObjectCheckedChanged={onRowCheckChange}
        checkedObjects={[{} as ParsedSkylarkObject]}
      />,
    );

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(1);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "clear-all-checked-objects" }),
    );

    expect(onRowCheckChange).toHaveBeenCalledWith([]);
  });
});

test("renders search results (with default language)", async () => {
  render(<ObjectSearch />);

  await screen.findByText("Display field"); // Search for table header
  await waitFor(() => {
    expect(
      screen.getByTestId("object-search-results-content"),
    ).toBeInTheDocument();
  });

  // Search for table content
  await screen.findAllByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
      .__SkylarkSet__title as string,
  );

  expect(
    screen.queryAllByText(
      GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
        .__SkylarkSet__title as string,
    ),
  ).toHaveLength(1);
});

test("renders search results with language as null (no default)", async () => {
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

  render(<ObjectSearch />);

  await screen.findByText("Display field"); // Search for table header
  // Search for table content
  await screen.findAllByText(
    GQLGameOfThronesSearchResultsPage1.data.search.objects[0]
      .__SkylarkSet__title as string,
  );

  expect(
    screen.queryAllByText(
      GQLGameOfThronesSearchResultsPage1.data.search.objects[0]
        .__SkylarkSet__title as string,
    ),
  ).toHaveLength(2);
});

test("opens filters and deselects all object types", async () => {
  render(<ObjectSearch defaultColumns={["uid"]} />);

  await screen.findByText("Display field"); // Search for table header

  fireEvent.click(
    screen.getByRole("button", {
      name: /open-search-filters/i,
    }),
  );

  await waitFor(() => {
    expect(screen.getAllByText("Object type").length).toBeGreaterThanOrEqual(1);
  });

  expect(screen.getAllByRole("checkbox")[0]).toHaveAttribute(
    "id",
    "checkbox-toggle-all-object-type",
  );

  await fireEvent.click(screen.getAllByRole("checkbox")[0]);

  expect(screen.getByLabelText("Episode")).toBeInTheDocument();
});

test("manually filters to only en-gb translated objects", async () => {
  // Arrange
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

  render(
    <ObjectSearch
      defaultColumns={["uid", OBJECT_LIST_TABLE.columnIds.translation]}
    />,
  );

  await screen.findByText("UID");
  await screen.findByText("Translation");

  await waitFor(() => {
    screen.getByTestId("object-search-results-content");
  });

  expect(
    screen.queryAllByText(
      GQLGameOfThronesSearchResultsPage1.data.search.objects[0].uid as string,
    ),
  ).toHaveLength(2);
  expect(screen.queryAllByText("en-GB").length).toBeGreaterThanOrEqual(1);
  expect(screen.queryAllByText("pt-PT").length).toBeGreaterThanOrEqual(1);

  // Act
  const combobox = screen.getByRole("combobox");
  await fireEvent.change(combobox, {
    target: { value: "en-GB" },
  });
  await fireEvent.click(
    within(screen.getByTestId("select-options")).getByText("en-GB"),
  );

  // Assert
  await screen.findByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
  );
  expect(
    screen.queryAllByText(
      GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
        .uid as string,
    ),
  ).toHaveLength(1);
  expect(screen.queryAllByText("en-GB").length).toBeGreaterThan(1);
  expect(screen.queryAllByText("pt-PT")).toHaveLength(0);
});

test("automatically filters to only en-gb translated objects as its the user/account's default language", async () => {
  await render(
    <ObjectSearch
      defaultColumns={["uid", OBJECT_LIST_TABLE.columnIds.translation]}
    />,
  );

  await waitFor(
    () => {
      expect(screen.getByRole("combobox")).toHaveValue("en-GB");
    },
    { timeout: 10000 },
  );

  // Assert
  await screen.findByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
  );

  expect(
    screen.queryAllByText(
      GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
        .uid as string,
    ),
  ).toHaveLength(1);
  expect(screen.queryAllByText("en-GB").length).toBeGreaterThan(1);
  expect(screen.queryAllByText("pt-PT")).toHaveLength(0);
}, 10000);

test("clears the language filter", async () => {
  // Arrange
  render(
    <ObjectSearch
      defaultColumns={["uid", OBJECT_LIST_TABLE.columnIds.translation]}
    />,
  );

  const combobox = screen.getByRole("combobox");
  await fireEvent.change(combobox, {
    target: { value: "en-GB" },
  });
  await fireEvent.click(
    within(screen.getByTestId("select-options")).getByText("en-GB"),
  );

  await screen.findByText("UID");

  await screen.findByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
  );
  expect(screen.queryAllByText("en-GB").length).toBeGreaterThan(1);
  expect(screen.queryAllByText("pt-PT")).toHaveLength(0);

  // Act
  await fireEvent.click(screen.getByTestId("select-clear-value"));

  // Assert
  await screen.findByTestId("search-spinner");

  await waitFor(() => {
    expect(screen.queryByTestId("search-spinner")).not.toBeInTheDocument();
  });

  await screen.findByText("UID");
  await screen.findByText("Translation");

  await waitFor(() => {
    screen.getByTestId("object-search-results-content");
  });

  expect(
    screen.queryAllByText(
      GQLGameOfThronesSearchResultsPage1.data.search.objects[0].uid as string,
    ),
  ).toHaveLength(2);
  expect(screen.queryAllByText("en-GB").length).toBeGreaterThanOrEqual(1);
  expect(screen.queryAllByText("pt-PT").length).toBeGreaterThanOrEqual(1);
});
