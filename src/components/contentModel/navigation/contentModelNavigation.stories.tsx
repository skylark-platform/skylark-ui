import { ComponentStory } from "@storybook/react";

import { ObjectTypeNavigation } from "./contentModelNavigation.component";

export default {
  title: "Components/ContentModel/Navigation",
  component: ObjectTypeNavigation,
};

const Template: ComponentStory<typeof ObjectTypeNavigation> = (args) => {
  return <ObjectTypeNavigation {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  activeObjectType: "Episode",
};
