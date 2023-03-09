import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { Search } from "./search.component";

export default {
  title: "Components/ObjectListing/Search",
  component: Search,
};

const graphqlQuery = {
  query: GET_SKYLARK_OBJECT_TYPES,
  variables: {},
};

const objectTypes = [
  "Sets",
  "Brand",
  "Season",
  "Episode",
  "Movie",
  "Theme",
  "Genre",
];

const columns = [
  "uid",
  "title",
  "title_short",
  "title_medium",
  "title_long",
  "synopsis_short",
  "synopsis_medium",
  "synopsis_long",
];

const Template: ComponentStory<typeof Search> = (args) => {
  return <Search {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  className: "w-[600px]",
  activeFilters: {
    objectTypes,
  },
  objectTypes,
  columns,
  visibleColumns: columns,
  graphqlQuery,
};

export const WithFiltersOpen = Template.bind({});
WithFiltersOpen.args = {
  ...Default.args,
};
WithFiltersOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const filtersButton = canvas.getByRole("button");

  await userEvent.click(filtersButton);
};
