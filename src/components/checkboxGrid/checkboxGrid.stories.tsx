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

const allOptionsChecked = options.map(({ option: { value } }) => value);

export const Default = Template.bind({});
Default.args = {
  options,
  checkedOptions: [],
};

export const DefaultChecked = Template.bind({});
DefaultChecked.args = {
  options,
  checkedOptions: allOptionsChecked,
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: "Checkbox Grid",
  options,
  checkedOptions: allOptionsChecked,
};

export const WithToggleAll = Template.bind({});
WithToggleAll.args = {
  withToggleAll: true,
  options,
  checkedOptions: allOptionsChecked,
};
