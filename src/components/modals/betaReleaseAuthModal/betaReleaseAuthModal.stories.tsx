import { ComponentStory } from "@storybook/react";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

export default {
  title: "Components/Modals/AddAuthTokenModal",
  component: AddAuthTokenModal,
};

const Template: ComponentStory<typeof AddAuthTokenModal> = (args) => (
  <AddAuthTokenModal {...args} />
);

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
  setIsOpen: () => "",
};
