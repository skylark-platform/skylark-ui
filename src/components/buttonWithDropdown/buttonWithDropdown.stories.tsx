import { ComponentStory } from "@storybook/react";
import { FiPlus, FiPlusCircle } from "react-icons/fi";

import { ButtonWithDropdown } from "./buttonWithDropdown.component";

export default {
  title: "Components/ButtonWithDropdown",
  component: ButtonWithDropdown,
};

const defaultProps = {
  children: "Button",
  success: false,
  danger: false,
  loading: false,
  disabled: false,
  block: false,
};

const Template: ComponentStory<typeof ButtonWithDropdown> = (args) => (
  <ButtonWithDropdown {...args} onClick={() => window.alert("clicked")} />
);

export const Default = Template.bind({});
Default.args = {
  ...defaultProps,
  children: "Save",
  options: [
    {
      id: "save-draft",
      text: "Save as Draft",
    },
  ],
};
