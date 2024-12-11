import { StoryFn } from "@storybook/react";

import Index from "src/pages/index";

export default {
  title: "Pages/Index",
  component: Index,
};

const Template: StoryFn = () => {
  return <Index />;
};

export const IndexPage = {
  render: Template,
};
