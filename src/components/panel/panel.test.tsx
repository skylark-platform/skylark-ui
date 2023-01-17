import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DocumentNode } from "graphql";

import { SkylarkObjectMeta } from "src/interfaces/skylark/objects";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";
import {
  GQLSkylarkSchemaQueryFixture,
  SKYLARK_OBJECT_FIELDS_FIXTURE,
} from "src/tests/fixtures";
import { GQLSkylarkGetObjectQueryFixture } from "src/tests/fixtures/panel.fixture";

import { Panel } from "./panel.component";

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
  {
    request: {
      query: createGetObjectQuery(object as SkylarkObjectMeta) as DocumentNode,
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

test("renders the panel", async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Episode"}
        closePanel={jest.fn()}
      />
    </MockedProvider>,
  );

  expect(screen.getByTestId("loading")).toBeInTheDocument();

  await waitFor(() => expect(screen.getByText("TITLE")).toBeInTheDocument());

  expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  expect(screen.getByText("A Golden Crown")).toBeInTheDocument();
  expect(screen.getAllByText("GOT S01E6 - A Golden Crown")).toHaveLength(2);
});

test("closing the panel using close button", async () => {
  const closePanel = jest.fn();
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Episode"}
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
        objectType={"Episode"}
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
