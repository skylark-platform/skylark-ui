import { userEvent, screen } from "@storybook/testing-library";

import { CompareSchemaVersions } from "./compareSchemaVersions.component";

export default { component: CompareSchemaVersions };
export const ObjectTypes = {
  args: {
    baseVersionNumber: 1,
    updateVersionNumber: 2,
  },
};

export const ObjectTypesWithAccordionOpen = {
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

export const Enums = {
  args: {
    baseVersionNumber: 1,
    updateVersionNumber: 2,
  },
  play: async () => {
    const enumButton = screen.getByText("Enums");
    await userEvent.click(enumButton);
  },
};

export const EnumsWithAccordionOpen = {
  args: {
    baseVersionNumber: 1,
    updateVersionNumber: 2,
  },
  play: async () => {
    const enumButton = screen.getByText("Enums");
    await userEvent.click(enumButton);

    const imageTypeButton = screen.getByRole("button", { name: /ImageType/ });
    await userEvent.click(imageTypeButton);
  },
};
