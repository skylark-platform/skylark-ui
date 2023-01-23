import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { DocumentNode } from "graphql";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import { getAllSearchableObjectsMeta } from "src/lib/skylark/objects";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";
import GQLSkylarkSearchableObjectsQueryFixture from "src/tests/fixtures/skylark/queries/introspection/searchableUnion.json";
import GQLGameOfThronesSearchResults from "src/tests/fixtures/skylark/queries/search/got.json";

import { ObjectList } from "./objectListing.component";

export default {
  title: "Components/ObjectListing",
  component: ObjectList,
};

const searchableObjectTypes =
  GQLSkylarkSearchableObjectsQueryFixture.data.__type.possibleTypes.map(
    ({ name }) => name,
  ) || [];
const searchableObjectsMeta = getAllSearchableObjectsMeta(
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
  searchableObjectTypes,
);

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
        result: GQLSkylarkSearchableObjectsQueryFixture,
      },
      {
        request: {
          query: GET_SKYLARK_SCHEMA,
        },
        result: GQLSkylarkSchemaQueryFixture,
      },
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
