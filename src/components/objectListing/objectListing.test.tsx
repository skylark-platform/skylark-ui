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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

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

beforeEach(() => {
  const router = { query: { edit: "true" } };
  useRouter.mockReturnValue(router);
});

test("renders search bar, filters with no objects returned", () => {
  render(
    <MockedProvider>
      <ObjectList />
    </MockedProvider>,
  );

  screen.findByPlaceholderText("Search for an object(s)");

  expect(screen.getByText("Filters")).toBeInTheDocument();
});

test("renders create button", () => {
  render(
    <MockedProvider>
      <ObjectList withCreateButtons onInfoClick={jest.fn()} />
    </MockedProvider>,
  );

  const createButton = screen.getByText("Create");

  fireEvent.click(createButton);

  expect(screen.getByText("Import (CSV)")).toBeInTheDocument();
});

test("does not render info button when onInfoClick is undefined", async () => {
  render(
    <MockedProvider>
      <ObjectList onInfoClick={undefined} />
    </MockedProvider>,
  );

  expect(
    await screen.queryByRole("button", {
      name: /object-info/i,
    }),
  ).not.toBeInTheDocument();
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
        <ObjectList withObjectEdit onInfoClick={jest.fn()} />
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
        <ObjectList withObjectEdit onInfoClick={jest.fn()} />
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
