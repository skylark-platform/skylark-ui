import { ComponentStory } from "@storybook/react";

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
