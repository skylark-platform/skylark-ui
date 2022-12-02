import { ComponentStory } from "@storybook/react";

import { Select } from "./select.component";

export default {
  title: "Components/Select",
  component: Select,
};

const Template: ComponentStory<typeof Select> = (args) => (
  <div className="w-64">
    <Select {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  options: ["Episode", "Season", "Brand"].map((val) => ({
    label: val,
    value: val,
  })),
};
