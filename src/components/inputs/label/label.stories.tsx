import { ComponentStory } from "@storybook/react";
import clsx from "clsx";

import { InputLabel } from "./label.component";

export default {
  title: "Components/Inputs/InputLabel",
  component: InputLabel,
};

const Template: ComponentStory<typeof InputLabel> = (args) => {
  return (
    <div className={clsx("w-96")}>
      <InputLabel {...args} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  text: "Label",
};

export const Required = Template.bind({});
Required.args = {
  text: "Label",
  isRequired: true,
};

export const WithCopyValue = Template.bind({});
WithCopyValue.args = {
  text: "Label",
  copyValue: "str",
};

export const WithHref = Template.bind({});
WithHref.args = {
  text: "Label",
  href: "str",
};

export const KitchenSink = Template.bind({});
KitchenSink.args = {
  text: "Label",
  isRequired: true,
  href: "str",
  copyValue: "str",
};
