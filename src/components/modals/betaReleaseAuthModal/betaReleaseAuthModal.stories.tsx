import { Meta } from "@storybook/react";

import { AddAuthTokenModal } from "./betaReleaseAuthModal.component";

const meta: Meta = {
  title: "Components/Modals/AddAuthTokenModal",
  component: AddAuthTokenModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

export default meta;

export const Default = {
  args: {
    isOpen: true,
    setIsOpen: () => "",
  },
};
