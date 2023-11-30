import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { ColourPicker } from "./colourPicker.component";

export default {
  title: "Components/Inputs/ColourPicker",
  component: ColourPicker,
};

const Template: ComponentStory<typeof ColourPicker> = (args) => (
  <ColourPicker {...args} />
);

export const Default = Template.bind({});
Default.args = { colour: "#FF33FF" };

export const Open = Template.bind({});
Open.args = {};
Open.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole("button");
  await userEvent.click(button);
};
