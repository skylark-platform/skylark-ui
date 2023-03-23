import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { Select } from "./select.component";

export default {
  title: "Components/Select",
  component: Select,
};

const options = ["Episode", "Season", "Brand"].map((val) => ({
  label: val,
  value: val,
}));

const Template: ComponentStory<typeof Select> = (args) => (
  <div className="w-64">
    <Select {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  options,
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: "Select Object Type",
  options,
};

export const WithSearch = Template.bind({});
WithSearch.args = {
  options,
  withSearch: true,
};

export const WithSearchCustomValue = Template.bind({});
WithSearchCustomValue.args = {
  options,
  withSearch: true,
  allowCustomValue: true,
};

export const Open = Template.bind({});
Open.args = {
  options,
};
Open.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const selectButton = canvas.getByRole("button");
  await userEvent.click(selectButton);

  await waitFor(async () => {
    await userEvent.hover(canvas.getByText("Season"));
  });
};

export const OpenWithSearch = Template.bind({});
OpenWithSearch.args = {
  options,
  withSearch: true,
};
OpenWithSearch.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const selectButton = canvas.getByRole("button");
  await userEvent.click(selectButton);

  await waitFor(async () => {
    await userEvent.hover(canvas.getByText("Season"));
  });
};

export const OpenWithSearchCustomValue = Template.bind({});
OpenWithSearchCustomValue.args = {
  options,
  withSearch: true,
  allowCustomValue: true,
};
OpenWithSearchCustomValue.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    const textInput = canvas.getByRole("combobox");
    await userEvent.type(textInput, "custominput");
  });
};
