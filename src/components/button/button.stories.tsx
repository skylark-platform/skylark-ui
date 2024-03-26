import { StoryFn } from "@storybook/react";
import { FiPlus, FiPlusCircle } from "react-icons/fi";

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

const Template: StoryFn<typeof Button> = (args) => (
  <Button {...args} onClick={() => window.alert("clicked")} />
);

export const Default = {
  render: Template,

  args: {
    ...defaultProps,
  },
};

export const Disabled = {
  render: Template,

  args: {
    ...defaultProps,
    disabled: true,
  },
};

export const Loading = {
  render: Template,

  argTypes: {
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
  },

  args: {
    ...defaultProps,
    loading: true,
  },
};

export const Neutral = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "neutral",
  },
};

export const Outline = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "outline",
  },
};

export const Ghost = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "ghost",
  },
};

export const GhostIconOnly = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "ghost",
    children: undefined,
    Icon: <FiPlusCircle className="text-xl" />,
  },
};

export const Form = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "form",
  },
};

export const GhostForm = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "form-ghost",
  },
};

export const Link = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "link",
  },
};

export const Success = {
  render: Template,

  args: {
    ...defaultProps,
    success: true,
  },
};

export const SuccessOutline = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "outline",
    success: true,
  },
};

export const Danger = {
  render: Template,

  args: {
    ...defaultProps,
    danger: true,
  },
};

export const DangerOutline = {
  render: Template,

  args: {
    ...defaultProps,
    variant: "outline",
    danger: true,
  },
};

export const FullWidth = {
  render: Template,

  args: {
    ...defaultProps,
    block: true,
  },
};

export const WithIcon = {
  render: Template,

  args: {
    ...defaultProps,
    Icon: <FiPlus className="text-xl" />,
  },
};
