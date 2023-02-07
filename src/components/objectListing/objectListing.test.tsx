import { MockedProvider } from "@apollo/client/testing";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { DocumentNode } from "graphql";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import {
  createGetObjectQuery,
  createSearchObjectsQuery,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SKYLARK_OBJECT_TYPES,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import {
  getAllObjectsMeta,
  getObjectOperations,
} from "src/lib/skylark/objects";
import GQLSkylarkGetObjectQueryFixture from "src/tests/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkObjectTypesQueryFixture from "src/tests/fixtures/skylark/queries/introspection/objectTypes.json";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";
import GQLSkylarkAllAvailTestMovieSearchFixture from "src/tests/fixtures/skylark/queries/search/allMediaTestMovieOnly.json";
import GQLGameOfThronesSearchResults from "src/tests/fixtures/skylark/queries/search/got.json";

import { ObjectList } from "./objectListing.component";

const searchableObjectTypes =
  GQLSkylarkObjectTypesQueryFixture.data.__type.possibleTypes.map(
    ({ name }) => name,
  ) || [];
const searchableObjectsMeta = getAllObjectsMeta(
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
  searchableObjectTypes,
);

const schemaMocks = [
  {
    request: {
      query: GET_SKYLARK_OBJECT_TYPES,
    },
    result: GQLSkylarkObjectTypesQueryFixture,
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
      query: createSearchObjectsQuery(
        searchableObjectsMeta,
        [],
      ) as DocumentNode,
    },
    result: GQLGameOfThronesSearchResults,
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
  await screen.findAllByText(
    GQLGameOfThronesSearchResults.data.search.objects[0].uid,
  );

  // Check for object info button
  await screen.findAllByRole("button", {
    name: /object-info/i,
  });

  expect(
    screen.getByText(
      GQLGameOfThronesSearchResults.data.search.objects[0].uid as string,
    ),
  ).toBeInTheDocument();
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

    expect(
      screen.getByDisplayValue(
        GQLGameOfThronesSearchResults.data.search.objects[0].uid,
      ),
    ).toHaveAttribute("disabled");
  });
});

test("open metadata panel, check information and close", async () => {
  const objectOperations = getObjectOperations(
    "Movie",
    GQLSkylarkSchemaQueryFixture.data
      .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
  );

  const mocks = [
    ...schemaMocks,
    {
      request: {
        variables: { ignoreAvailability: true, queryString: "" },
        query: createSearchObjectsQuery(
          searchableObjectsMeta,
          [],
        ) as DocumentNode,
      },
      result: GQLSkylarkAllAvailTestMovieSearchFixture,
    },
    {
      request: {
        query: createGetObjectQuery(objectOperations) as DocumentNode,
        variables: {
          ignoreAvailability: true,
          uid: GQLSkylarkAllAvailTestMovieSearchFixture.data.search.objects[0]
            .uid,
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
    expect(screen.getByTestId("panel-header")).toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(screen.getByTestId("panel-header")).toBeInTheDocument(),
  );

  const panelHeader = screen.getByTestId("panel-header");
  expect(
    within(panelHeader).getByText("All Avail Test Movie"),
  ).toBeInTheDocument();
  /*
  fireEvent.click(screen.getByTestId("panel-background"));

  await waitFor(() =>
    expect(screen.queryByTestId("panel-header")).not.toBeInTheDocument(),
  );
  */
});
