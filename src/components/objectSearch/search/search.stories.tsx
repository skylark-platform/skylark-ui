import { StoryFn } from "@storybook/react";
import { userEvent, screen } from "@storybook/testing-library";
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

const Template: StoryFn<typeof Search> = (args) => {
  return (
    <div className="w-full h-[500px]">
      <Search {...args} />
    </div>
  );
};

export const Default = {
  render: Template,

  args: {
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
  },
};

export const WithFiltersOpen = {
  render: Template,

  args: {
    ...Default.args,
  },

  play: async () => {
    const filtersButton = screen.getByLabelText("Open Search Options");

    await userEvent.click(filtersButton);
  },
};

export const WithLanguageOpen = {
  render: Template,

  args: {
    ...Default.args,
  },

  play: async () => {
    const combobox = screen.getByRole("combobox");
    await userEvent.type(combobox, "en-");
  },
};
