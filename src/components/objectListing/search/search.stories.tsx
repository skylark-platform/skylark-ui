import { ComponentStory } from "@storybook/react";

import { Search } from "./search.component";

export default {
  title: "Components/ObjectListing/Search",
  component: Search,
};

const Template: ComponentStory<typeof Search> = (args) => {
  return <Search {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  className: "w-[600px]",
};
