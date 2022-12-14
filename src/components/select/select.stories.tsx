import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

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

export const Open = Template.bind({});
Open.args = {
  options: ["Episode", "Season", "Brand"].map((val) => ({
    label: val,
    value: val,
  })),
};
Open.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const selectButton = canvas.getByRole("button");
  await userEvent.click(selectButton);

  await waitFor(async () => {
    await userEvent.hover(canvas.getByText("Season"));
  });
};
