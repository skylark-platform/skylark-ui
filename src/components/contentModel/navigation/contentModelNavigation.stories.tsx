import { StoryFn } from "@storybook/react";

import { ObjectTypeNavigation } from "./contentModelNavigation.component";

export default {
  title: "Components/ContentModel/Navigation",
  component: ObjectTypeNavigation,
};

const Template: StoryFn<typeof ObjectTypeNavigation> = (args) => {
  return <ObjectTypeNavigation {...args} />;
};

export const Default = {
  render: Template,

  args: {
    activeObjectType: "Episode",
  },
};
