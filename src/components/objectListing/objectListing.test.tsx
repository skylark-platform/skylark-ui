import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";

import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import {
  GQLSkylarkSearchableObjectsQueryFixture,
  GQLSkylarkSchemaQueryFixture,
  GQLSkylarkSearchQueryFixture,
  GQLSkylarkDynamicSearchQuery,
} from "src/tests/fixtures";

import { ObjectList } from "./objectListing.component";

const defaultMocks = [
  {
    request: {
      query: GET_SEARCHABLE_OBJECTS,
    },
    result: {
      data: GQLSkylarkSearchableObjectsQueryFixture,
    },
  },
  {
    request: {
      query: GET_SKYLARK_SCHEMA,
    },
    result: {
      data: GQLSkylarkSchemaQueryFixture.data,
    },
  },
  {
    request: {
      variables: { ignoreAvailability: true, queryString: "" },
      query: GQLSkylarkDynamicSearchQuery,
    },
    result: {
      data: GQLSkylarkSearchQueryFixture,
    },
  },
];

test("renders search bar, filters with no objects returned", () => {
  render(
    <MockedProvider>
      <ObjectList />
    </MockedProvider>,
  );

  screen.findByPlaceholderText("Search for an object(s)");

  expect(screen.getByRole("button")).toHaveTextContent("Filters");
});

test("renders create buttons", () => {
  render(
    <MockedProvider>
      <ObjectList withCreateButtons />
    </MockedProvider>,
  );

  expect(screen.getByRole("link")).toHaveTextContent("Import");
});

test("renders row select checkboxes", () => {
  render(
    <MockedProvider>
      <ObjectList withObjectSelect />
    </MockedProvider>,
  );

  expect(
    screen.getByRole("checkbox", { name: "toggle-select-all-objects" }),
  ).toBeInTheDocument();
});

test("renders search results", async () => {
  render(
    <MockedProvider mocks={defaultMocks}>
      <ObjectList />
    </MockedProvider>,
  );

  await screen.findByText("UID"); // Search for table header
  // Search for table content
  await screen.findAllByText("xxxx-xxxx-xxxx-xxxx");
  await screen.findAllByText("Short title");

  // Check for object info button
  await screen.findAllByRole("button", {
    name: /object-info/i,
  });

  expect(screen.getByText("Episode 1")).toBeInTheDocument();
});

test("opens filters and deselects all object types", async () => {
  render(
    <MockedProvider mocks={defaultMocks}>
      <ObjectList />
    </MockedProvider>,
  );

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
    "checkbox-toggle-all",
  );

  await fireEvent.click(screen.getAllByRole("checkbox")[0]);

  expect(screen.getByLabelText("Episode")).toBeInTheDocument();
});

describe("row in edit mode", () => {
  test("save/cancel icon appears", async () => {
    render(
      <MockedProvider mocks={defaultMocks}>
        <ObjectList withObjectEdit />
      </MockedProvider>,
    );

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
    render(
      <MockedProvider mocks={defaultMocks}>
        <ObjectList withObjectEdit />
      </MockedProvider>,
    );

    await screen.findByText("UID"); // Search for table header

    await screen.findAllByRole("button", {
      name: /object-info/i,
    });

    await fireEvent.click(
      screen.getAllByRole("button", {
        name: /object-edit/i,
      })[0],
    );

    expect(screen.getByDisplayValue("xxxx-xxxx-xxxx-xxxx")).toHaveAttribute(
      "disabled",
    );
  });
});
