import { MockedProvider } from "@apollo/client/testing";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { DocumentNode } from "graphql";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";
import { getObjectOperations } from "src/lib/skylark/objects";
import GQLSkylarkGetObjectQueryFixture from "src/tests/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/tests/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";

import { Panel } from "./panel.component";

const movieObjectOperations = getObjectOperations(
  "Movie",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

const imageObjectOperations = getObjectOperations(
  "Image",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

const mocks = [
  {
    request: {
      query: createGetObjectQuery(movieObjectOperations) as DocumentNode,
      variables: {
        ignoreAvailability: true,
        uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
      },
    },
    result: GQLSkylarkGetObjectQueryFixture,
  },
  {
    request: {
      query: createGetObjectQuery(imageObjectOperations) as DocumentNode,
      variables: {
        ignoreAvailability: true,
        uid: GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid,
      },
    },
    result: GQLSkylarkGetObjectImageQueryFixture,
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

test("renders the objects primaryField and colour in the header when given", async () => {
  const mockWithRandomPrimaryField = {
    request: {
      query: createGetObjectQuery(movieObjectOperations) as DocumentNode,
      variables: {
        ignoreAvailability: true,
        uid: "withPrimaryField",
      },
    },
    result: {
      data: {
        getObject: {
          ...GQLSkylarkGetObjectQueryFixture.data.getObject,
          uid: "withPrimaryField",
          _config: {
            ...GQLSkylarkGetObjectQueryFixture.data.getObject._config,
            primary_field: "release_date",
            colour: "rgb(123, 123, 123)",
          },
        },
      },
    },
  };

  render(
    <MockedProvider
      mocks={[...mocks, mockWithRandomPrimaryField]}
      addTypename={false}
    >
      <Panel
        uid={mockWithRandomPrimaryField.result.data.getObject.uid}
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
  const panelHeader = within(screen.getByTestId("panel-header"));
  expect(
    panelHeader.getByText(
      mockWithRandomPrimaryField.result.data.getObject.release_date,
    ),
  ).toBeInTheDocument();
  expect(
    panelHeader.getByText(
      mockWithRandomPrimaryField.result.data.getObject.__typename,
    ),
  ).toHaveAttribute("style", "background-color: rgb(123, 123, 123);");
});

test("renders an image and the original image size when the object type is an Image", async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Panel
        uid={GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid}
        objectType={"Image"}
        closePanel={jest.fn()}
      />
    </MockedProvider>,
  );

  await waitFor(() => expect(screen.getByText("TITLE")).toBeInTheDocument());

  expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  expect(screen.getByText("ORIGINAL SIZE")).toBeInTheDocument();
  expect(
    screen.getByAltText(
      GQLSkylarkGetObjectImageQueryFixture.data.getObject.title,
    ),
  ).toBeInTheDocument();
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
      `Title: ${GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].title}`,
    ),
  ).toBeInTheDocument();

  const thumbnailCount =
    GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects.filter(
      ({ type }) => type === "THUMBNAIL",
    ).length;

  expect(
    screen.getByText(
      `${GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].type} (${thumbnailCount})`,
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

test.skip("availability view", async () => {
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
