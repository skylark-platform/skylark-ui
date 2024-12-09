import { userEvent, screen } from "@storybook/test";

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
    const seasonButton = await screen.findByRole("button", { name: /Season/ });
    await userEvent.click(seasonButton);

    const episodeButton = await screen.findByRole("button", {
      name: /Episode/,
    });
    await userEvent.click(episodeButton);

    const availabilityButton = await screen.findByRole("button", {
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
    const enumButton = await screen.findByText("Enums");
    await userEvent.click(enumButton);
  },
};

export const EnumsWithAccordionOpen = {
  args: {
    baseVersionNumber: 1,
    updateVersionNumber: 2,
  },
  play: async () => {
    const enumButton = await screen.findByText("Enums");
    await userEvent.click(enumButton);

    const imageTypeButton = await screen.findByRole("button", {
      name: /ImageType/,
    });
    await userEvent.click(imageTypeButton);
  },
};
