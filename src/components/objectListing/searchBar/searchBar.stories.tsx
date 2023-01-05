import { ComponentStory } from "@storybook/react";

import { SearchBar } from "./searchBar.component";

export default {
  title: "Components/SearchBar",
  component: SearchBar,
};

const Template: ComponentStory<typeof SearchBar> = (args) => {
  return <SearchBar {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  // objectTypes: [],
  className: "w-[600px]",
};
