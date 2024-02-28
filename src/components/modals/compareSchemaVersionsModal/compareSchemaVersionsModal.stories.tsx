import type { Meta } from "@storybook/react";
import { userEvent, screen } from "@storybook/testing-library";

import { CompareSchemaVersionsModal } from "./compareSchemaVersionsModal.component";

const meta: Meta<typeof CompareSchemaVersionsModal> = {
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

export const Default: Meta<typeof CompareSchemaVersionsModal> = {
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
