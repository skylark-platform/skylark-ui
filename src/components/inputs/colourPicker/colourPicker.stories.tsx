import { userEvent, screen } from "@storybook/testing-library";

import { ColourPicker } from "./colourPicker.component";

export default {
  title: "Components/Inputs/ColourPicker",
  component: ColourPicker,
};

export const Default = {
  args: { colour: "#FF33FF" },
};

export const Open = {
  args: {},

  play: async () => {
    const button = screen.getByRole("button");
    await userEvent.click(button);
  },
};
