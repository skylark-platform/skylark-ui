import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { VisibilityState } from "@tanstack/react-table";

import { createObjectListingColumns } from "src/components/objectSearch/results/columnConfiguration";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { Search } from "./search.component";

export default {
  title: "Components/ObjectSearch/Search",
  component: Search,
};

const graphqlQuery = {
  query: GET_SKYLARK_OBJECT_TYPES,
  variables: {},
  headers: {},
};

const objectTypes = [
  "Set",
  "Brand",
  "Season",
  "Episode",
  "Movie",
  "Theme",
  "Genre",
];

const columnIds = [
  "uid",
  "title",
  "title_short",
  "title_medium",
  "title_long",
  "synopsis_short",
  "synopsis_medium",
  "synopsis_long",
];

const columns = createObjectListingColumns(columnIds, { withPanel: false });

const visibleColumns: VisibilityState = Object.fromEntries(
  columnIds.map((column) => [column, true]),
);

const Template: ComponentStory<typeof Search> = (args) => {
  return (
    <div className="w-full h-[500px]">
      <Search {...args} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  className: "w-[600px]",
  filters: {
    objectTypes,
    language: "",
    availability: {
      dimensions: null,
      timeTravel: null,
    },
    query: "",
  },
  columns,
  columnIds,
  visibleColumns,
  graphqlQuery,
};

export const WithFiltersOpen = Template.bind({});
WithFiltersOpen.args = {
  ...Default.args,
};
WithFiltersOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const filtersButton = canvas.getByLabelText("Open Search Options");

  await userEvent.click(filtersButton);
};

export const WithLanguageOpen = Template.bind({});
WithLanguageOpen.args = {
  ...Default.args,
};
WithLanguageOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const combobox = canvas.getByRole("combobox");
  await userEvent.type(combobox, "en-");
};
