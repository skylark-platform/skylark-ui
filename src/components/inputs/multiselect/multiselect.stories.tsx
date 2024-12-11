import { StoryFn } from "@storybook/react";
import { userEvent, waitFor, screen } from "@storybook/test";
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

const Template: StoryFn<typeof MultiSelect> = (args) => {
  return (
    <div className={clsx("w-96")}>
      <MultiSelect {...args} onChange={() => ""} />
    </div>
  );
};

export const Default = {
  render: Template,

  args: {
    options,
  },
};

export const WithSelected = {
  render: Template,

  args: {
    options,
    selected: [options[0].value, options[1].value],
  },
};

export const WithLabel = {
  render: Template,

  args: {
    label: "Select Object Type",
    options,
  },
};

export const WithFormLabel = {
  render: Template,

  args: {
    label: "Select Object Type",
    labelVariant: "form",
    options,
  },
};

export const Open = {
  render: Template,

  args: {
    options,
  },

  play: async () => {
    await waitFor(async () => {
      const textInput = screen.getByRole("combobox");
      await userEvent.type(textInput, "E");
    });
  },
};

export const OpenNothingFound = {
  render: Template,

  args: {
    options,
  },

  play: async () => {
    await waitFor(async () => {
      const textInput = screen.getByRole("combobox");
      await userEvent.type(textInput, "custominput");
    });
  },
};
