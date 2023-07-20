import { ComponentStory, Story } from "@storybook/react";
import { userEvent, waitFor, within, screen } from "@storybook/testing-library";
import clsx from "clsx";

import { Select } from "./select.component";

export default {
  title: "Components/Inputs/Select",
  component: Select,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (Story: Story) => (
      <div style={{ height: "300px" }}>
        <Story />
      </div>
    ),
  ],
};

const options = ["Episode", "Season", "Brand"].map((val) => ({
  label: val,
  value: val,
}));

const Template: ComponentStory<typeof Select> = (args) => {
  return (
    <div className={clsx(args.variant === "pill" ? "w-28" : "w-96")}>
      <Select {...args} onChange={() => ""} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  options,
};

export const WithSelected = Template.bind({});
WithSelected.args = {
  options,
  selected: options[0].value,
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: "Select Object Type",
  options,
};

export const WithFormLabel = Template.bind({});
WithFormLabel.args = {
  label: "Select Object Type",
  labelVariant: "form",
  options,
};

// export const Rounded = Template.bind({});
// Rounded.args = {
//   options,
//   rounded: true,
// };

export const WithSearch = Template.bind({});
WithSearch.args = {
  options,
  searchable: true,
};

export const WithoutSearch = Template.bind({});
WithoutSearch.args = {
  options,
  searchable: false,
};

export const Pill = Template.bind({});
Pill.args = {
  options,
  variant: "pill",
};

export const OpenWithoutSearch = Template.bind({});
OpenWithoutSearch.args = {
  options,
  searchable: false,
};
OpenWithoutSearch.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const selectButton = canvas.getByRole("button");
  await userEvent.click(selectButton);

  await waitFor(async () => {
    // Select uses a Portal so isn't within the canvasElement
    await userEvent.hover(screen.getByText("Season"));
  });
};

export const OpenWithSearch = Template.bind({});
OpenWithSearch.args = {
  options,
  searchable: true,
};
OpenWithSearch.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const selectButton = canvas.getByRole("button");
  await userEvent.click(selectButton);

  await waitFor(async () => {
    // Select uses a Portal so isn't within the canvasElement
    await userEvent.hover(screen.getByText("Season"));
  });
};

export const OpenWithSearchNothingFound = Template.bind({});
OpenWithSearchNothingFound.args = {
  options,
  searchable: true,
};
OpenWithSearchNothingFound.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    const textInput = canvas.getByRole("combobox");
    await userEvent.type(textInput, "custominput");
  });
};

export const OpenWithSearchCustomValue = Template.bind({});
OpenWithSearchCustomValue.args = {
  options,
  searchable: true,
  allowCustomValue: true,
};
OpenWithSearchCustomValue.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    const textInput = canvas.getByRole("combobox");
    await userEvent.type(textInput, "custominput");
  });
};
