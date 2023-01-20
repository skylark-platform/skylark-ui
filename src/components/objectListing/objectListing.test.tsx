import { MockedProvider } from "@apollo/client/testing";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { DocumentNode } from "graphql";

import { SkylarkObjectMeta } from "src/interfaces/skylark/objects";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import {
  GQLSkylarkSearchableObjectsQueryFixture,
  GQLSkylarkSchemaQueryFixture,
  GQLSkylarkSearchQueryFixture,
  GQLSkylarkDynamicSearchQuery,
  SKYLARK_OBJECT_FIELDS_FIXTURE,
} from "src/tests/fixtures";
import { GQLSkylarkGetObjectQueryFixture } from "src/tests/fixtures/panel.fixture";

import { ObjectList } from "./objectListing.component";

const schemaMocks = [
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
];

const defaultMocks = [
  ...schemaMocks,
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
    "checkbox-toggle-all-object-type",
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

test("open metadata panel, check information and close", async () => {
  const object = {
    name: "Episode",
    fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name,
      type: "string",
    })),
    operations: {
      get: {
        name: "getEpisode",
        type: "Query",
      },
    },
  };
  const mocks = [
    ...schemaMocks,
    {
      request: {
        variables: { ignoreAvailability: true, queryString: "" },
        query: GQLSkylarkDynamicSearchQuery,
      },
      result: {
        data: {
          search: {
            objects: [GQLSkylarkGetObjectQueryFixture.data.getObject],
          },
        },
      },
    },
    {
      request: {
        query: createGetObjectQuery(
          object as SkylarkObjectMeta,
        ) as DocumentNode,
        variables: {
          ignoreAvailability: true,
          uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
        },
      },
      result: GQLSkylarkGetObjectQueryFixture,
    },
  ];

  render(
    <MockedProvider mocks={mocks}>
      <ObjectList />
    </MockedProvider>,
  );

  await screen.findAllByRole("button", {
    name: /object-info/i,
  });

  const infoButton = screen.getAllByRole("button", {
    name: /object-info/i,
  });

  fireEvent.click(infoButton[0]);

  await waitFor(() =>
    expect(screen.getByTestId("panel-background")).toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(screen.getByTestId("panel-header")).toBeInTheDocument(),
  );

  const panelHeader = screen.getByTestId("panel-header");
  expect(
    within(panelHeader).getByText("GOT S01E6 - A Golden Crown"),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByTestId("panel-background"));

  await waitFor(() =>
    expect(screen.queryByTestId("panel-background")).not.toBeInTheDocument(),
  );
});
