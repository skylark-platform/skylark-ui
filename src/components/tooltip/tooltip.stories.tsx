import { StoryFn } from "@storybook/react";
import { userEvent, waitFor, screen } from "@storybook/test";

import { Tooltip } from "./tooltip.component";

export default {
  title: "Components/Tooltip",
  component: Tooltip,
};

const Template: StoryFn = () => (
  <Tooltip tooltip={<span>My tooltip message</span>}>
    <p className="w-28">Hover me</p>
  </Tooltip>
);

const sleep = (timeMs: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

export const Default = {
  render: Template,

  play: async () => {
    await waitFor(async () => {
      await userEvent.hover(screen.getByText("Hover me"));
    });

    await sleep(1000);

    await screen.findAllByText(/My tooltip message/);
  },
};
