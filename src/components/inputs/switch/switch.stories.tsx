import { ComponentStory } from "@storybook/react";

import { Switch } from "./switch.component";

export default {
  title: "Components/Inputs/Switch",
  component: Switch,
};

const Template: ComponentStory<typeof Switch> = (args) => {
  return <Switch {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  enabled: false,
};

export const DefaultEnabled = Template.bind({});
DefaultEnabled.args = {
  enabled: true,
};

export const Small = Template.bind({});
Small.args = {
  enabled: false,
  size: "small",
};

export const SmallEnabled = Template.bind({});
SmallEnabled.args = {
  enabled: true,
  size: "small",
};
