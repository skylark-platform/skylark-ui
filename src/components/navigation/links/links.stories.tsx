import { StoryFn } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";

import { NavigationLinks } from "./links.component";

export default {
  title: "Components/Navigation/Links",
  component: NavigationLinks,
};

const Template: StoryFn<typeof NavigationLinks> = () => <NavigationLinks />;

export const Default = {
  render: Template,
};

export const WithActivePath = {
  render: Template,
  parameters: {
    nextjs: {
      router: {
        asPath: "/developer/graphql-editor",
      },
    },
  },
};

export const WithOpenDropdown = {
  render: Template,
  play: async () => {
    const navigationButton = screen.getByText("Developer");

    await userEvent.click(navigationButton);

    await screen.findAllByText("API Documentation");
  },
};
