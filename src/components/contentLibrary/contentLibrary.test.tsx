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
import { getAllObjectsMeta } from "src/lib/skylark/objects";
import GQLSkylarkGetObjectQueryFixture from "src/tests/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkObjectTypesQueryFixture from "src/tests/fixtures/skylark/queries/introspection/objectTypes.json";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";
import GQLSkylarkAllAvailTestMovieSearchFixture from "src/tests/fixtures/skylark/queries/search/allMediaTestMovieOnly.json";
import { movieObjectOperations } from "src/tests/utils/objectOperations";

import { ContentLibrary } from "./contentLibrary.component";

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

test("open metadata panel, check information and close", async () => {
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
        query: createGetObjectQuery(movieObjectOperations, []) as DocumentNode,
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
      <ContentLibrary />
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
    expect(screen.getByTestId("drag-bar")).toBeInTheDocument(),
  );

  await waitFor(() =>
    expect(screen.getByTestId("panel-header")).toBeInTheDocument(),
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
