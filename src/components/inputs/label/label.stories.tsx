import { StoryFn } from "@storybook/react";
import clsx from "clsx";

import { InputLabel } from "./label.component";

export default {
  title: "Components/Inputs/Labels/InputLabel",
  component: InputLabel,
};

const Template: StoryFn<typeof InputLabel> = (args) => {
  return (
    <div className={clsx("w-96")}>
      <InputLabel {...args} />
    </div>
  );
};

export const Default = {
  render: Template,

  args: {
    text: "Label",
  },
};

export const Required = {
  render: Template,

  args: {
    text: "Label",
    isRequired: true,
  },
};

export const WithCopyValue = {
  render: Template,

  args: {
    text: "Label",
    copyValue: "str",
  },
};

export const WithHref = {
  render: Template,

  args: {
    text: "Label",
    href: "str",
  },
};

export const KitchenSink = {
  render: Template,

  args: {
    text: "Label",
    isRequired: true,
    href: "str",
    copyValue: "str",
  },
};
