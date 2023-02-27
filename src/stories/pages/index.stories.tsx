import { ComponentStory } from "@storybook/react";

import Index from "src/pages/index";

export default {
  title: "Pages/Index",
  component: Index,
};

const Template: ComponentStory<typeof Index> = () => {
  return <Index />;
};

export const IndexPage = Template.bind({});
