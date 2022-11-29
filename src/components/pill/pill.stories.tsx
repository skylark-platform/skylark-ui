import { ComponentStory } from "@storybook/react";

import { Pill } from "./pill.component";

export default {
  title: "Components/Pill",
  component: Pill,
};

const Template: ComponentStory<typeof Pill> = (args) => <Pill {...args} />;

export const Default = Template.bind({});
Default.args = {
  label: "Episode",
  bgColor: "orange",
};
