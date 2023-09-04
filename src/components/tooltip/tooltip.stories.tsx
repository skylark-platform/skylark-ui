import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { graphql } from "msw";

import { Tooltip } from "./tooltip.component";

export default {
  title: "Components/Tooltip",
  component: Tooltip,
};

const Template: ComponentStory<typeof Tooltip> = () => (
  <Tooltip tooltip={<span>My tooltip message</span>}>
    <p className="w-28">Hover me</p>
  </Tooltip>
);

const sleep = (timeMs: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

export const Default = Template.bind({});
Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    await userEvent.hover(canvas.getByText("Hover me"));
  });

  await sleep(1000);

  await canvas.findAllByText(/My tooltip message/);
};
