import { ComponentStory } from "@storybook/react";

import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { SearchFilter } from "./searchFilter.component";

export default {
  title: "Components/ObjectSearch/Search/Filter",
  component: SearchFilter,
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
].map((col) => ({ value: col }));

const Template: ComponentStory<typeof SearchFilter> = (args) => {
  return (
    <div className="w-full max-w-4xl">
      <SearchFilter {...args} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  activeObjectTypes: objectTypes,
  objectTypesWithConfig,
  columns,
  visibleColumns: columns.map(({ value }) => value),
  graphqlQuery,
};

export const WithNoFiltersSelected = Template.bind({});
WithNoFiltersSelected.args = {
  activeObjectTypes: [],
  objectTypesWithConfig,
  columns,
  visibleColumns: [],
  graphqlQuery,
};
