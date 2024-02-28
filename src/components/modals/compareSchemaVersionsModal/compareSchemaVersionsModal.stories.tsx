import { userEvent, screen } from "@storybook/testing-library";

import { CompareSchemaVersionsModal } from "./compareSchemaVersionsModal.component";

export default { component: CompareSchemaVersionsModal };
export const Default = {
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
