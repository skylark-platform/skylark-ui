import { ComponentStory } from "@storybook/react";

import { CheckboxGrid, CheckboxOptionState } from "./checkboxGrid.component";

export default {
  title: "Components/CheckboxGrid",
  component: CheckboxGrid,
};

const Template: ComponentStory<typeof CheckboxGrid> = (args) => (
  <CheckboxGrid {...args} />
);

const options: CheckboxOptionState[] = Object.entries({
  Brand: true,
  Season: true,
  Episode: false,
  Person: false,
  Tag: false,
  Theme: false,
  Genre: false,
}).map(
  ([name, checked]): CheckboxOptionState => ({
    option: {
      label: name,
      value: name,
    },
    state: checked,
  }),
);

export const Default = Template.bind({});
Default.args = {
  className: "w-96",
  options,
};

export const WithToggleAll = Template.bind({});
WithToggleAll.args = {
  className: "w-96",
  withToggleAll: true,
  options,
};
