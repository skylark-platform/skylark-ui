import { StoryFn } from "@storybook/react";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

export default {
  title: "Components/Modals/AddAuthTokenModal",
  component: AddAuthTokenModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: StoryFn) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

export const Default = {
  args: {
    isOpen: true,
    setIsOpen: () => "",
  },
};
