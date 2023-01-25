import { MockedProvider } from "@apollo/client/testing";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  getByAltText,
} from "@testing-library/react";
import { DocumentNode } from "graphql";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";
import { getObjectOperations } from "src/lib/skylark/objects";
import GQLSkylarkGetObjectQueryFixture from "src/tests/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";

import { Panel } from "./panel.component";

const objectOperations = getObjectOperations(
  "Movie",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

const mocks = [
  {
    request: {
      query: createGetObjectQuery(objectOperations) as DocumentNode,
      variables: {
        ignoreAvailability: true,
        uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
      },
    },
    result: GQLSkylarkGetObjectQueryFixture,
  },
  {
    request: {
      query: GET_SKYLARK_SCHEMA,
    },
    result: GQLSkylarkSchemaQueryFixture,
  },
];

test("renders the panel in the default view", async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
      />
    </MockedProvider>,
  );

  await waitFor(() => expect(screen.getByText("TITLE")).toBeInTheDocument());

  expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  expect(
    screen.getByText("All Availabilities Test Movie (for dimension testing)"),
  ).toBeInTheDocument();
  expect(screen.getAllByText("All Avail Test Movie")).toHaveLength(2);
});

test("imagery view", async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
      />
    </MockedProvider>,
  );

  await waitFor(() => expect(screen.getByText("Imagery")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Imagery"));

  expect(screen.getAllByText("All Avail Test Movie")).toHaveLength(1);
  expect(
    screen.getByText(
      GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].title,
    ),
  ).toBeInTheDocument();

  const image = screen.getByAltText(
    GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].title,
  );

  expect(image).toHaveAttribute(
    "src",
    GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].url,
  );
});

test("availability view", async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
      />
    </MockedProvider>,
  );

  expect(
    screen.queryAllByText(
      GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
        .title,
    ),
  ).toHaveLength(0);

  await waitFor(() =>
    expect(screen.getByText("Availability")).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByText("Availability"));

  expect(screen.getAllByText("All Avail Test Movie")).toHaveLength(1);
  expect(
    screen.getByText(
      GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
        .title,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[1]
        .title,
    ),
  ).toBeInTheDocument();
});

test("closing the panel using close button", async () => {
  const closePanel = jest.fn();
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={closePanel}
      />
    </MockedProvider>,
  );

  await waitFor(() => expect(screen.getByText("Close")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Close"));

  expect(closePanel).toHaveBeenCalled();
});

test("closing the panel by background backdrop", async () => {
  const closePanel = jest.fn();
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={closePanel}
      />
    </MockedProvider>,
  );

  await waitFor(() =>
    expect(screen.getByTestId("panel-background")).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByTestId("panel-background"));

  expect(closePanel).toHaveBeenCalled();
});
