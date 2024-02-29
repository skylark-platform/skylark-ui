import { StoryFn } from "@storybook/react";

import { SearchInput } from "./searchInput.component";

export default {
  title: "Components/ObjectSearch/Search/Input",
  component: SearchInput,
};

const Template: StoryFn<typeof SearchInput> = (args) => {
  return <SearchInput {...args} />;
};

export const Default = {
  render: Template,

  args: {
    className: "w-[600px]",
    toggleFilterOpen: () => alert("toggle filter clicked"),
  },
};

export const WithSearchQuery = {
  render: Template,

  args: {
    ...Default.args,
    searchQuery: "Game of Thrones",
  },
};
