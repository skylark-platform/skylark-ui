import { ComponentStory } from "@storybook/react";

import { CheckboxGrid } from "./checkboxGrid.component";

export default {
  title: "Components/CheckboxGrid",
  component: CheckboxGrid,
};

const Template: ComponentStory<typeof CheckboxGrid> = (args) => (
  <CheckboxGrid {...args} />
);

export const Default = Template.bind({});
Default.args = {
  className: "w-96",
  options: {
    Brand: true,
    Season: true,
    Episode: false,
    Person: false,
    Tag: false,
    Theme: false,
    Genre: false,
  },
};
