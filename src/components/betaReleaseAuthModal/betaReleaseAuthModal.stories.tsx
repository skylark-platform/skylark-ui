import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { pause } from "src/lib/utils";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

export default {
  title: "Components/AddAuthTokenModal",
  component: AddAuthTokenModal,
};

const Template: ComponentStory<typeof AddAuthTokenModal> = (args) => (
  <AddAuthTokenModal {...args} />
);

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
};
