import { StoryFn } from "@storybook/react";
import { userEvent, screen } from "@storybook/test";

import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuOption,
  DropdownMenuSection,
} from "./dropdown.component";

export default {
  title: "Components/Dropdown",
  component: DropdownMenu,
};

const Template: StoryFn<typeof DropdownMenu> = (args) => (
  <DropdownMenu {...args}>
    <DropdownMenuButton>Open Dropdown</DropdownMenuButton>
  </DropdownMenu>
);

const options: DropdownMenuOption[] = [
  { id: "1", text: "Option 1" },
  { id: "2", text: "Option 2" },
  { id: "3", text: "Option 3" },
  { id: "4", text: "Option 4" },
];

const sections: DropdownMenuSection[] = [
  { id: "section-1", options },
  { id: "section-2", label: "Label", options },
];

export const Default = {
  render: Template,

  args: {
    options,
    placement: "bottom-end",
  },

  play: async () => {
    const openButton = screen.getByText("Open Dropdown");
    await userEvent.click(openButton);
  },
};

export const Sections = {
  render: Template,

  args: {
    options: sections,
    placement: "bottom-end",
  },

  play: async () => {
    const openButton = screen.getByText("Open Dropdown");
    await userEvent.click(openButton);
  },
};
