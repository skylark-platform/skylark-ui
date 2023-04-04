import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within, screen } from "@storybook/testing-library";

import { CreateObjectModal } from "./createObjectModal.component";

export default {
  title: "Components/ObjectListing/CreateObjectModal",
  component: CreateObjectModal,
};

const Template: ComponentStory<typeof CreateObjectModal> = (args) => {
  return <CreateObjectModal {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
};

export const WithEpisodeSelected = Template.bind({});
WithEpisodeSelected.args = {
  isOpen: true,
  objectType: "Episode",
};
