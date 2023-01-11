import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { SkylarkObjectFields } from "src/interfaces/skylark/objects";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import {
  GQLSkylarkSchemaQueryFixture,
  GQLSkylarkSearchableObjectsQueryFixture,
  GQLSkylarkSearchQueryFixture,
  SKYLARK_OBJECT_FIELDS_FIXTURE,
} from "src/tests/fixtures";

import { ObjectList } from "./objectListing.component";

export default {
  title: "Components/ObjectListing",
  component: ObjectList,
};

const searchableObjects = [
  {
    name: "Episode",
    fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
      name,
      type: "string",
      isList: false,
      isRequired: false,
    })),
  },
] as SkylarkObjectFields[];
const searchQuery = createSearchObjectsQuery(searchableObjects, ["Episode"]);

const Template: ComponentStory<typeof ObjectList> = (args) => {
  return <ObjectList {...args} />;
};

export const Default = Template.bind({});
Default.parameters = {
  apolloClient: {
    mocks: [
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
          query: searchQuery,
        },
        result: {
          data: GQLSkylarkSearchQueryFixture,
        },
      },
    ],
  },
};

export const WithFiltersOpen = Template.bind({});
WithFiltersOpen.parameters = {
  ...Default.parameters,
};
WithFiltersOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const filtersButton = canvas.getByRole("button");

  await canvas.findAllByText("Short title");

  await userEvent.click(filtersButton);
};

export const WithCreateButtons = Template.bind({});
WithCreateButtons.args = {
  withCreateButtons: true,
};
WithCreateButtons.parameters = {
  ...Default.parameters,
};

export const KitchenSink = Template.bind({});
KitchenSink.args = {
  withCreateButtons: true,
  withObjectSelect: true,
  withObjectEdit: true,
};
KitchenSink.parameters = {
  ...Default.parameters,
};
