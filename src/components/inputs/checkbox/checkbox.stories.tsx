import { ComponentStory } from "@storybook/react";

import { Checkbox } from "./checkbox.component";

export default {
  title: "Components/Inputs/Checkbox",
  component: Checkbox,
};

const Template: ComponentStory<typeof Checkbox> = (args) => (
  <Checkbox {...args} />
);

export const Default = Template.bind({});
Default.args = {};

export const Checked = Template.bind({});
Checked.args = {
  checked: true,
};
