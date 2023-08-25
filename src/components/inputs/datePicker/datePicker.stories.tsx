import { ComponentStory } from "@storybook/react";
import clsx from "clsx";

import { DatePicker } from "./datePicker.component";

export default {
  title: "Components/Inputs/DatePicker",
  component: DatePicker,
};

const Template: ComponentStory<typeof DatePicker> = (args) => {
  return (
    <div className={clsx("text-sm")}>
      <DatePicker />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {};
