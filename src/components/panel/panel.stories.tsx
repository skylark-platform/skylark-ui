import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { DocumentNode } from "graphql";
import React from "react";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { SkylarkObjectMeta } from "src/interfaces/skylark";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SKYLARK_OBJECT_TYPES,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import { getObjectOperations } from "src/lib/skylark/objects";
import GQLSkylarkGetObjectQueryFixture from "src/tests/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetSetWithContentQueryFixture from "src/tests/fixtures/skylark/queries/getObject/setWithContent.json";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";

import { Panel } from "./panel.component";

export default {
  title: "Components/Panel",
  component: Panel,
  argTypes: {},
};

const episodeObjectOperations = getObjectOperations(
  "Episode",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

const seasonObjectOperations = getObjectOperations(
  "Season",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

const setObjectOperations = getObjectOperations(
  "Set",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

const Template: ComponentStory<typeof Panel> = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <Panel {...args} closePanel={() => alert("Close clicked")} />
    </div>
  );
};

export const Default = Template.bind({});
Default.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: createGetObjectQuery(
            episodeObjectOperations as SkylarkObjectMeta,
            [],
          ) as DocumentNode,
          variables: {
            ignoreAvailability: true,
            uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
          },
        },
        result: GQLSkylarkGetObjectQueryFixture,
      },
      {
        request: {
          query: createGetObjectQuery(
            setObjectOperations as SkylarkObjectMeta,
            [seasonObjectOperations, setObjectOperations], // Order should be the same as the object types returned in GET_SKYLARK_OBJECT_TYPES
          ) as DocumentNode,
          variables: {
            ignoreAvailability: true,
            uid: GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid,
          },
        },
        result: GQLSkylarkGetSetWithContentQueryFixture,
      },
      {
        request: {
          query: GET_SKYLARK_SCHEMA,
        },
        result: GQLSkylarkSchemaQueryFixture,
      },
      {
        request: {
          query: GET_SKYLARK_OBJECT_TYPES,
        },
        result: {
          data: {
            __type: {
              possibleTypes: [
                { name: "Season", __typename: "__Type" },
                { name: "Set", __typename: "__Type" },
              ],
              __typename: "__Type",
            },
          },
        },
      },
    ],
  },
};
Default.args = {
  objectType: "Episode",
  uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
};

export const Imagery = Template.bind({});
Imagery.parameters = Default.parameters;
Imagery.args = {
  ...Default.args,
};
Imagery.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Imagery/i });
  const tabButton = canvas.getByRole("button", { name: /Imagery/i });

  await waitFor(async () => {
    userEvent.click(tabButton);
  });
};

export const Content = Template.bind({});
Content.parameters = Default.parameters;
Content.args = {
  objectType: "Set",
  uid: GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid,
};
Content.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Content/i });
  const tabButton = canvas.getByRole("button", { name: /Content/i });

  await waitFor(async () => {
    userEvent.click(tabButton);
  });
};

export const ContentEditing = Template.bind({});
ContentEditing.parameters = Default.parameters;
ContentEditing.args = {
  objectType: "Set",
  uid: GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid,
};
ContentEditing.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Content/i });
  const tabButton = canvas.getByRole("button", { name: /Content/i });

  await waitFor(async () => {
    userEvent.click(tabButton);
  });

  await canvas.findByRole("button", { name: /Edit metadata/i });
  const editButton = canvas.getByRole("button", { name: /Edit metadata/i });

  await waitFor(async () => {
    userEvent.click(editButton);
  });
};

/*
export const Availability = Template.bind({});
Availability.parameters = Default.parameters;
Availability.args = {
  ...Default.args,
};
Availability.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Availability/i });
  const imageryButton = canvas.getByRole("button", { name: /Availability/i });

  await waitFor(async () => {
    userEvent.click(imageryButton);
  });
};
*/
