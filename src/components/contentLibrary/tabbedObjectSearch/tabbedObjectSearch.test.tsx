import { graphql } from "msw";

import AccountFixture from "src/__tests__/fixtures/skylark/queries/getUserAndAccount.json";
import { server } from "src/__tests__/mocks/server";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { GQLSkylarkAccountResponse } from "src/interfaces/skylark";

import {
  ObjectSearchTab,
  TabbedObjectSearch,
} from "./tabbedObjectSearch.component";

const mockLocalStorage = (initialTabs?: ObjectSearchTab[]) => {
  Storage.prototype.getItem = jest.fn().mockImplementation((param) => {
    switch (param) {
      case LOCAL_STORAGE.betaAuth.uri:
        return "http://localhost:3000";
      case LOCAL_STORAGE.betaAuth.token:
        return "token";
      case LOCAL_STORAGE.accountPrefixed(
        AccountFixture.data.getAccount.account_id,
      ).contentLibrary.tabState:
        return initialTabs ? JSON.stringify(initialTabs) : null;
      // Also check that tab index is ignored if longer than the initial tab state arr
      case LOCAL_STORAGE.accountPrefixed(
        AccountFixture.data.getAccount.account_id,
      ).contentLibrary.activeTabIndex:
        return 50000;
      default:
        return null;
    }
  });
};

afterEach(() => {
  jest.resetAllMocks();
});

test("Loads the default tabs when localStorage is empty", async () => {
  mockLocalStorage();

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
  });

  const tabsContainer = within(screen.getByTestId("object-search-tabs"));
  expect(tabsContainer.queryAllByText("Default View")).toHaveLength(1);
  expect(tabsContainer.queryAllByText("Availability")).toHaveLength(1);
});

test("Changing tabs", async () => {
  mockLocalStorage();

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
  });

  const tabsContainer = within(screen.getByTestId("object-search-tabs"));

  fireEvent.click(tabsContainer.getByText("Availability"));

  expect(screen.queryAllByText("Default View")).toHaveLength(1);
  expect(screen.queryAllByText("Availability")).toHaveLength(3);
});

test("Rename active tab (save)", async () => {
  mockLocalStorage();

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
  });

  fireEvent.click(screen.getByLabelText("Rename active tab"));

  await waitFor(() => {
    expect(screen.getByLabelText("tab name input")).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText("tab name input"), {
    target: { value: "All objects in English" },
  });

  fireEvent.click(screen.getByLabelText("save tab rename"));

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(0);
  });
  await waitFor(() => {
    expect(screen.queryAllByText("All objects in English")).toHaveLength(2);
  });
});

test("Rename active tab (save with enter key)", async () => {
  mockLocalStorage();

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
  });

  fireEvent.click(screen.getByLabelText("Rename active tab"));

  await waitFor(() => {
    expect(screen.getByLabelText("tab name input")).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText("tab name input"), {
    target: { value: "All objects in English" },
  });

  fireEvent.keyDown(screen.getByLabelText("tab name input"), {
    key: "Enter",
    code: 13,
    charCode: 13,
  });

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(0);
  });
  await waitFor(() => {
    expect(screen.queryAllByText("All objects in English")).toHaveLength(2);
  });
});

test("Rename active tab (cancel)", async () => {
  mockLocalStorage();

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
  });

  fireEvent.click(screen.getByLabelText("Rename active tab"));

  await waitFor(() => {
    expect(screen.getByLabelText("tab name input")).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText("tab name input"), {
    target: { value: "All objects in English" },
  });

  fireEvent.click(screen.getByLabelText("cancel tab rename"));

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(2);
  });
  await waitFor(() => {
    expect(screen.queryAllByText("All objects in English")).toHaveLength(0);
  });
});

test("Add new view", async () => {
  mockLocalStorage();

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
  });

  const tabsContainer = screen.getByTestId("object-search-tabs");
  expect(tabsContainer.children.length).toBe(2);

  fireEvent.click(screen.getByText("Add view"));

  await waitFor(() => {
    expect(screen.queryAllByText("Default View")).toHaveLength(1);
  });

  expect(screen.queryAllByText("View 3")).toHaveLength(2);
});

test("Loads values from localStorage", async () => {
  const initialTabs: ObjectSearchTab[] = [
    {
      id: "123",
      name: "Initial tab 1",
      filters: {
        query: "GOT",
        objectTypes: ["Episode"],
        availability: {
          dimensions: null,
          timeTravel: null,
        },
      },
    },
    {
      id: "456",
      name: "Another tab",
      filters: {
        query: "",
        objectTypes: ["Season"],
        availability: {
          dimensions: null,
          timeTravel: null,
        },
      },
      columnsState: {
        columns: ["uid"],
        frozen: ["uid"],
      },
    },
  ];

  mockLocalStorage(initialTabs);

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.queryByText("Default View")).not.toBeInTheDocument();
  });

  await waitFor(() => {
    expect(screen.queryAllByText(initialTabs[0].name as string)).toHaveLength(
      2,
    );
  });
});

test("Shows error message when Account ID can't be loaded", async () => {
  mockLocalStorage();

  server.use(
    // Override GET_USER_AND_ACCOUNT query so the Account ID empty
    graphql.query("GET_USER_AND_ACCOUNT", (req, res, ctx) => {
      const data: GQLSkylarkAccountResponse = {
        getAccount: {
          config: null,
          account_id: "",
          skylark_version: "latest",
        },
      };
      return res(ctx.data(data));
    }),
  );

  render(<TabbedObjectSearch />);

  await waitFor(() => {
    expect(screen.getByText("Something went wrong...")).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(screen.queryByText("Default View")).not.toBeInTheDocument();
  });

  expect(
    screen.getByText(
      "We are having trouble accessing your Skylark Account ID.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Please contact our Customer Success team."),
  ).toBeInTheDocument();
});

describe("create button", () => {
  test("renders create button", async () => {
    mockLocalStorage();

    render(<TabbedObjectSearch />);
    await waitFor(() => {
      expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
    });

    const createButton = screen.getByText("Create");

    await fireEvent.click(createButton);

    const csvImportButton = await screen.getByText("Import (CSV)");
    expect(csvImportButton).toBeInTheDocument();
    expect(csvImportButton.closest("a")).toHaveAttribute("href", "import/csv");
  });

  test("opens the create object modal", async () => {
    mockLocalStorage();

    render(<TabbedObjectSearch />);

    await waitFor(() => {
      expect(screen.queryAllByText("Default View")).toHaveLength(2); // Length 2 as active
    });

    const createButton = screen.getByText("Create");

    await fireEvent.click(createButton);

    const createObjectButton = await screen.getByText("Create Object");
    expect(createObjectButton).toBeInTheDocument();

    fireEvent.click(createObjectButton);

    await waitFor(() =>
      expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
    );
  });
});
