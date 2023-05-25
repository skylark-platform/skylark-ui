import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import clsx from "clsx";

import { MultiSelect } from "./multiselect.component";

export default {
  title: "Components/Inputs/MultiSelect",
  component: MultiSelect,
};

const options = ["Episode", "Season", "Brand", "Set", "Image", "Asset"].map(
  (val) => ({
    label: val,
    value: val,
  }),
);

const Template: ComponentStory<typeof MultiSelect> = (args) => {
  return (
    <div className={clsx("w-96")}>
      <MultiSelect {...args} onChange={(selected) => console.log(selected)} />
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
  selected: [options[0].value, options[1].value],
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

export const Open = Template.bind({});
Open.args = {
  options,
};
Open.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    const textInput = canvas.getByRole("combobox");
    await userEvent.type(textInput, "E");
  });
};

export const OpenNothingFound = Template.bind({});
OpenNothingFound.args = {
  options,
};
OpenNothingFound.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    const textInput = canvas.getByRole("combobox");
    await userEvent.type(textInput, "custominput");
  });
};
