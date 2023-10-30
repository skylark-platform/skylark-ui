import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

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

const Template: ComponentStory<typeof DropdownMenu> = (args) => (
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

export const Default = Template.bind({});
Default.args = {
  options,
  placement: "bottom-end",
};
Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const openButton = canvas.getByText("Open Dropdown");
  await userEvent.click(openButton);
};

export const Sections = Template.bind({});
Sections.args = {
  options: sections,
  placement: "bottom-end",
};
Sections.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const openButton = canvas.getByText("Open Dropdown");
  await userEvent.click(openButton);
};
