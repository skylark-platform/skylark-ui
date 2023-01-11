import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import {
  GQLSkylarkDynamicSearchQuery,
  GQLSkylarkSchemaQueryFixture,
  GQLSkylarkSearchableObjectsQueryFixture,
  GQLSkylarkSearchQueryFixture,
} from "src/tests/fixtures";

import { ObjectList } from "./objectListing.component";

export default {
  title: "Components/ObjectListing",
  component: ObjectList,
};

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
          query: GQLSkylarkDynamicSearchQuery,
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
