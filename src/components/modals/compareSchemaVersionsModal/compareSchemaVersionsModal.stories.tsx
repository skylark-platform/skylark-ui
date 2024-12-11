import type { Meta } from "@storybook/react";
import { userEvent, screen } from "@storybook/test";

import { CompareSchemaVersionsModal } from "./compareSchemaVersionsModal.component";

const meta: Meta = {
  component: CompareSchemaVersionsModal,
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

export const Default: Meta = {
  args: {
    isOpen: true,
    baseVersionNumber: 1,
    updateVersionNumber: 2,
  },
};

export const WithAccordionOpen = {
  ...Default,
  play: async () => {
    const brandButton = await screen.findByRole("button", { name: /Brand/ });
    await userEvent.click(brandButton);
  },
};
