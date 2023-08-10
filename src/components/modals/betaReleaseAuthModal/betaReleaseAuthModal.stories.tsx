import { ComponentStory, Story } from "@storybook/react";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

export default {
  title: "Components/Modals/AddAuthTokenModal",
  component: AddAuthTokenModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: Story) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: ComponentStory<typeof AddAuthTokenModal> = (args) => (
  <AddAuthTokenModal {...args} />
);

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
  setIsOpen: () => "",
};
