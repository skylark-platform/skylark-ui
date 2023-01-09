import { ComponentStory } from "@storybook/react";

import { SearchInput } from "./searchInput.component";

export default {
  title: "Components/ObjectListing/Search/Input",
  component: SearchInput,
};

const Template: ComponentStory<typeof SearchInput> = (args) => {
  return <SearchInput {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  className: "w-[600px]",
  toggleFilterOpen: () => alert("toggle filter clicked"),
};

export const WithSearchQuery = Template.bind({});
WithSearchQuery.args = {
  ...Default.args,
  searchQuery: "Game of Thrones",
};
