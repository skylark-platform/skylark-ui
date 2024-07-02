import { graphql } from "msw";

import GQLGameOfThronesSearchResultsPage1 from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import GQLGameOfThronesSearchResultsPage1enGB from "src/__tests__/fixtures/skylark/queries/search/gotPage1enGB.json";
import { server } from "src/__tests__/mocks/server";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  AvailabilityStatus,
  GQLSkylarkAccountResponse,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

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
  render(<ObjectSearch id="test" />);

  screen.findByPlaceholderText("Search for an object(s)");

  expect(screen.getByLabelText("Open Search Options")).toBeInTheDocument();
});

test("renders search bar, filters with no objects returned", async () => {
  jest.useFakeTimers();

  render(<ObjectSearch id="test" />);

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

test("renders the info button on row hover when setPanelObject is given", async () => {
  render(<ObjectSearch id="test" setPanelObject={() => ""} />);

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
  render(<ObjectSearch id="test" setPanelObject={undefined} />);

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

test("calls setPanelObject when the row is clicked", async () => {
  const setPanelObject = jest.fn();

  render(<ObjectSearch id="test" setPanelObject={setPanelObject} />);

  await screen.findAllByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
      .__SkylarkSet__title as string,
  );

  fireEvent.click(
    screen.getByText(
      GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
        .__SkylarkSet__title as string,
    ),
  );

  expect(setPanelObject).toHaveBeenCalled();
});

test("calls window.open to open the object in a new tab when the row is clicked", async () => {
  jest.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
  window.open = jest.fn();

  render(<ObjectSearch id="test" setPanelObject={jest.fn()} />);

  const object = GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0];

  await screen.findAllByText(object.__SkylarkSet__title as string);

  fireEvent.click(screen.getByText(object.__SkylarkSet__title as string), {
    metaKey: true,
  });

  expect(window.open).toHaveBeenCalledWith(
    `/object/${object.__typename}/${object.uid}?language=${object._meta.language_data.language}`,
    "_blank",
  );
});

describe("with object select (checkboxes)", () => {
  test("renders row select checkboxes", async () => {
    await render(<ObjectSearch id="test" withObjectSelect />);

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(0);
  });

  test("bulk options are disabled when nothing is checked", async () => {
    await render(<ObjectSearch id="test" withObjectSelect />);

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(0);

    expect(screen.getByRole("button", { name: "Bulk Options" })).toBeDisabled();
  });

  test("fires on rowCheckChange callback when a checkbox is checked", async () => {
    const onRowCheckChange = jest.fn();

    await render(
      <ObjectSearch
        id="test"
        withObjectSelect
        onObjectCheckedChanged={onRowCheckChange}
        checkedObjectsState={[]}
      />,
    );

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(1);

    const checkbox = (await withinResults.findAllByRole("checkbox"))[1];

    await fireEvent.click(checkbox);

    expect(onRowCheckChange).toHaveBeenLastCalledWith([
      {
        checkedState: true,
        object: expect.any(Object),
      },
    ]);
  });

  test("resets the checked rows when the search changes", async () => {
    jest.useFakeTimers();

    const resetCheckedObjects = jest.fn();

    await render(
      <ObjectSearch
        id="test"
        withObjectSelect
        resetCheckedObjects={resetCheckedObjects}
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

    expect(resetCheckedObjects).toHaveBeenCalledTimes(3);
  });

  test("clears all selected rows using the toggle all", async () => {
    const onRowCheckChange = jest.fn();

    await render(
      <ObjectSearch
        id="test"
        withObjectSelect
        onObjectCheckedChanged={onRowCheckChange}
        checkedObjectsState={[
          {
            object: {
              meta: { language: "en-GB", availableLanguages: [] },
            } as unknown as ParsedSkylarkObject,
            checkedState: true,
          },
        ]}
      />,
    );

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThanOrEqual(1);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "clear-all-checked-objects" }),
    );

    expect(onRowCheckChange).toHaveBeenCalledWith([]);
  });

  test("bulk options are enabled when objects are checked", async () => {
    await render(
      <ObjectSearch
        id="test"
        withObjectSelect
        checkedObjectsState={[
          {
            object: {
              meta: { language: "en-GB", availableLanguages: [] },
            } as unknown as ParsedSkylarkObject,
            checkedState: true,
          },
        ]}
      />,
    );

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(0);

    expect(screen.getByRole("button", { name: "Bulk Options" })).toBeEnabled();
  });
});

test("renders search results (with default language)", async () => {
  render(<ObjectSearch id="test" />);

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
    graphql.query(wrapQueryName("GET_USER_AND_ACCOUNT"), (req, res, ctx) => {
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

  render(<ObjectSearch id="test" />);

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
  render(<ObjectSearch id="test" initialColumnState={{ columns: ["uid"] }} />);

  await screen.findByText("Display field"); // Search for table header

  fireEvent.click(
    screen.getByRole("button", {
      name: /Open Search Options/i,
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
    graphql.query(wrapQueryName("GET_USER_AND_ACCOUNT"), (req, res, ctx) => {
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
      id="test"
      initialColumnState={{
        columns: ["uid", OBJECT_LIST_TABLE.columnIds.translation],
      }}
    />,
  );

  await screen.findByText("UID");
  await screen.findByText("Translation");

  await waitFor(() => {
    screen.getByTestId("object-search-results-content");
  });

  await waitFor(() => {
    expect(
      screen.queryAllByText(
        GQLGameOfThronesSearchResultsPage1.data.search.objects[0].uid as string,
      ),
    ).toHaveLength(2);
  });

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
      id="test"
      initialColumnState={{
        columns: ["uid", OBJECT_LIST_TABLE.columnIds.translation],
      }}
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
      id="test"
      initialColumnState={{
        columns: ["uid", OBJECT_LIST_TABLE.columnIds.translation],
      }}
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

  await waitFor(() => {
    expect(screen.queryAllByText("en-GB").length).toBeGreaterThan(1);
  });

  expect(screen.queryAllByText("pt-PT")).toHaveLength(0);

  // Act
  await fireEvent.click(screen.getByTestId("select-clear-value"));

  // Assert
  await screen.findByTestId("object-search-loading-spinner");

  await waitFor(() => {
    expect(
      screen.queryByTestId("object-search-loading-spinner"),
    ).not.toBeInTheDocument();
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

describe("batch options", () => {
  test("opens delete objects modal", async () => {
    await render(
      <ObjectSearch
        id="test"
        withObjectSelect
        checkedObjectsState={[
          {
            object: {
              uid: "123",
              objectType: "Episode",
              meta: {
                language: "en-GB",
                availableLanguages: [],
                availabilityStatus: AvailabilityStatus.Unavailable,
                versions: {},
              },
              metadata: {
                uid: "123",
                external_id: "",
                title: "my episode",
              },
              config: { primaryField: "title" },
              availability: {
                status: AvailabilityStatus.Unavailable,
                objects: [],
              },
            } as ParsedSkylarkObject,
            checkedState: true,
          },
        ]}
      />,
    );

    const results = await screen.findByTestId("object-search-results-content");

    const withinResults = within(results);

    expect(
      (await withinResults.findAllByRole("checkbox")).length,
    ).toBeGreaterThan(0);

    const button = screen.getByRole("button", { name: "Bulk Options" });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    const dropdownButton = await screen.findByText("Delete Selected Objects");
    fireEvent.click(dropdownButton);

    expect(await screen.findByText("Bulk Delete")).toBeInTheDocument();

    const modal = within(screen.getByTestId("batch-delete-objects-modal"));

    expect(modal.getByText("my episode")).toBeInTheDocument();
    expect(modal.getByText("en-GB")).toBeInTheDocument();
  });
});
