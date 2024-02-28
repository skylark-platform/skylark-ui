import { StoryFn } from "@storybook/react";

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

const Template: StoryFn<typeof ButtonWithDropdown> = (args) => (
  <ButtonWithDropdown {...args} onClick={() => window.alert("clicked")} />
);

export const Default = {
  render: Template,

  args: {
    ...defaultProps,
    children: "Save",
    options: [
      {
        id: "save-draft",
        text: "Save as Draft",
      },
    ],
  },
};
