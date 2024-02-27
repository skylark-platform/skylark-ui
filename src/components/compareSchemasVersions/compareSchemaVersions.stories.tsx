import { userEvent, screen } from "@storybook/testing-library";

import { CompareSchemaVersions } from "./compareSchemaVersions.component";

export default { component: CompareSchemaVersions };
export const Default = {
  args: {
    baseVersionNumber: 1,
    updateVersionNumber: 2,
  },
};

export const WithAccordionOpen = {
  args: {
    baseVersionNumber: 1,
    updateVersionNumber: 2,
  },
  play: async () => {
    const seasonButton = screen.getByRole("button", { name: /Season/ });
    await userEvent.click(seasonButton);

    const episodeButton = screen.getByRole("button", { name: /Episode/ });
    await userEvent.click(episodeButton);

    const availabilityButton = screen.getByRole("button", {
      name: /Availability/,
    });
    await userEvent.click(availabilityButton);
  },
};
