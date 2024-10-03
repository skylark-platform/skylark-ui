import { StoryFn } from "@storybook/react";

import { ObjectTypeSelectAndOverview } from "./contentModelNavigation.component";

export default {
  title: "Components/ContentModel/Navigation",
  component: ObjectTypeSelectAndOverview,
};

const Template: StoryFn<typeof ObjectTypeSelectAndOverview> = (args) => {
  return <ObjectTypeSelectAndOverview {...args} />;
};

export const Default = {
  render: Template,

  args: {
    activeObjectType: "Episode",
  },
};
