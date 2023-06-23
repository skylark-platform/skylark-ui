import { ComponentStory } from "@storybook/react";

import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { SearchFilter } from "./searchFilter.component";

export default {
  title: "Components/ObjectListing/Search/Filter",
  component: SearchFilter,
};

const graphqlQuery = {
  query: GET_SKYLARK_OBJECT_TYPES,
  variables: {},
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

const objectTypesWithConfig = objectTypes.map((objectType) => ({
  objectType,
  config: undefined,
}));

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

const Template: ComponentStory<typeof SearchFilter> = (args) => {
  return (
    <div className="w-96">
      <SearchFilter {...args} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  activeFilters: {
    objectTypes,
    language: "",
  },
  objectTypesWithConfig,
  columns,
  visibleColumns: columns,
  graphqlQuery,
};

export const WithNoFiltersSelected = Template.bind({});
WithNoFiltersSelected.args = {
  activeFilters: {
    objectTypes: [],
    language: "",
  },
  objectTypesWithConfig,
  columns,
  visibleColumns: [],
  graphqlQuery,
};
