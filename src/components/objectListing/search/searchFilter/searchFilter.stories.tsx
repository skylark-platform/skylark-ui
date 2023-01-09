import { ComponentStory } from "@storybook/react";

import { SearchFilter } from "./searchFilter.component";

export default {
  title: "Components/ObjectListing/Search/Filter",
  component: SearchFilter,
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
  },
  objectTypes,
  columns,
  visibleColumns: columns,
};

export const WithNoFiltersSelected = Template.bind({});
WithNoFiltersSelected.args = {
  activeFilters: {
    objectTypes: [],
  },
  objectTypes,
  columns,
  visibleColumns: [],
};
