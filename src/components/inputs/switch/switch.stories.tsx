import { StoryFn } from "@storybook/react";

import { Switch } from "./switch.component";

export default {
  title: "Components/Inputs/Switch",
  component: Switch,
};

const Template: StoryFn<typeof Switch> = (args) => {
  return <Switch {...args} />;
};

export const Default = {
  render: Template,

  args: {
    enabled: false,
  },
};

export const DefaultEnabled = {
  render: Template,

  args: {
    enabled: true,
  },
};

export const Small = {
  render: Template,

  args: {
    enabled: false,
    size: "small",
  },
};

export const SmallEnabled = {
  render: Template,

  args: {
    enabled: true,
    size: "small",
  },
};
