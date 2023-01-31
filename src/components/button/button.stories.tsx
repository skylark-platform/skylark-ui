import { ComponentStory } from "@storybook/react";
import { BsPlusLg, BsPlusCircle } from "react-icons/bs";

import { Button } from "./button.component";

export default {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      options: ["primary", "outline", "ghost"],
      control: { type: "radio" },
    },
    success: {
      control: { type: "boolean" },
    },
    danger: {
      control: { type: "boolean" },
    },
  },
};

const defaultProps = {
  children: "Button",
  success: false,
  danger: false,
  loading: false,
  disabled: false,
  block: false,
};

const Template: ComponentStory<typeof Button> = (args) => (
  <Button {...args} onClick={() => window.alert("clicked")} />
);

export const Default = Template.bind({});
Default.args = {
  ...defaultProps,
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...defaultProps,
  disabled: true,
};

export const Loading = Template.bind({});
Loading.argTypes = {
  variant: {
    options: ["solid", "outline", "ghost"],
    control: { type: "radio" },
  },
  success: {
    control: { type: "boolean" },
  },
  danger: {
    control: { type: "boolean" },
  },
  children: {
    control: false,
  },
  loading: {
    control: false,
  },
  disabled: {
    control: false,
  },
};
Loading.args = {
  ...defaultProps,
  loading: true,
};

export const Outline = Template.bind({});
Outline.args = {
  ...defaultProps,
  variant: "outline",
};

export const Ghost = Template.bind({});
Ghost.args = {
  ...defaultProps,
  variant: "ghost",
};

export const GhostIconOnly = Template.bind({});
GhostIconOnly.args = {
  ...defaultProps,
  variant: "ghost",
  children: undefined,
  Icon: <BsPlusCircle className="text-xl" />,
};

export const Success = Template.bind({});
Success.args = {
  ...defaultProps,
  success: true,
};

export const SuccessOutline = Template.bind({});
SuccessOutline.args = {
  ...defaultProps,
  variant: "outline",
  success: true,
};

export const Danger = Template.bind({});
Danger.args = {
  ...defaultProps,
  danger: true,
};

export const DangerOutline = Template.bind({});
DangerOutline.args = {
  ...defaultProps,
  variant: "outline",
  danger: true,
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  ...defaultProps,
  block: true,
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  ...defaultProps,
  Icon: <BsPlusLg />,
};
