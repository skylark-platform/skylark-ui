import { StoryFn } from "@storybook/react";
import clsx from "clsx";

import { RadioGroup } from "./radioGroup.component";

export default {
  title: "Components/Inputs/RadioGroup",
  component: RadioGroup,
};

const options = ["Episode", "Season", "Brand"].map((val) => ({
  label: val,
  value: val,
}));

const Template: StoryFn<typeof RadioGroup> = (args) => {
  return (
    <div className={clsx("w-96")}>
      <RadioGroup {...args} onChange={() => ""} />
    </div>
  );
};

export const Default = {
  render: Template,

  args: {
    options,
    selected: options[0],
  },
};
