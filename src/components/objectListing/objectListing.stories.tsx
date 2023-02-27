import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { DocumentNode } from "graphql";

import GQLSkylarkObjectTypesQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/objectTypes.json";
import GQLSkylarkSchemaQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/schema.json";
import GQLGameOfThronesSearchResults from "src/__tests__/fixtures/skylark/queries/search/got.json";
import { SEARCH_PAGE_SIZE } from "src/hooks/useSearch";
import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SKYLARK_OBJECT_TYPES,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import { getAllObjectsMeta } from "src/lib/skylark/objects";

import { ObjectList } from "./objectListing.component";

export default {
  title: "Components/ObjectListing",
  component: ObjectList,
};

const objectTypes =
  GQLSkylarkObjectTypesQueryFixture.data.__type.possibleTypes.map(
    ({ name }) => name,
  ) || [];
const searchableObjectsMeta = getAllObjectsMeta(
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
  objectTypes,
);

const Template: ComponentStory<typeof ObjectList> = (args) => {
  return <ObjectList {...args} />;
};

export const Default = Template.bind({});

export const WithFiltersOpen = Template.bind({});
WithFiltersOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const filtersButton = canvas.getByRole("button", { name: /Filters/i });

  await canvas.findAllByText(
    GQLGameOfThronesSearchResults.data.search.objects[0]
      .__Asset__title as string,
  );

  await userEvent.click(filtersButton);
};

export const WithCreateButtons = Template.bind({});
WithCreateButtons.args = {
  withCreateButtons: true,
};

export const KitchenSink = Template.bind({});
KitchenSink.args = {
  withCreateButtons: true,
  withObjectSelect: true,
  withObjectEdit: true,
};
