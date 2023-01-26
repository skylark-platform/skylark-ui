import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { NavigationLinks } from "./links.component";

export default {
  title: "Components/Navigation/Links",
  component: NavigationLinks,
};

const Template: ComponentStory<typeof NavigationLinks> = () => (
  <NavigationLinks />
);

export const Default = Template.bind({});

export const WithActivePath = Template.bind({});
WithActivePath.parameters = {
  nextRouter: {
    path: "/",
    asPath: "/",
  },
};

export const WithOpenDropdown = Template.bind({});
WithOpenDropdown.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const navigationButton = canvas.getByText("Developer");

  await userEvent.click(navigationButton);

  await canvas.findAllByText("API Documentation");
};
