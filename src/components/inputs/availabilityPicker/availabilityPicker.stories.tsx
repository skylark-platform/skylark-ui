import { StoryFn } from "@storybook/react";
import { userEvent, screen } from "@storybook/test";
import clsx from "clsx";

import { UTC_NAME } from "src/components/inputs/select";

import { AvailabilityPicker } from "./availabilityPicker.component";

export default {
  title: "Components/Inputs/AvailabilityPicker",
  component: AvailabilityPicker,
};

const Template: StoryFn<typeof AvailabilityPicker> = (args) => {
  return (
    <div className={clsx("w-96")}>
      <AvailabilityPicker {...args} />
    </div>
  );
};

export const Button = {
  render: Template,

  args: {
    activeValues: {
      dimensions: null,
      timeTravel: null,
    },
  },
};

export const ButtonWithDimensions = {
  render: Template,

  args: {
    activeValues: {
      dimensions: {
        "device-types": "pc",
        "customer-types": "premium",
        affiliates: "affiliate-1",
      },
      timeTravel: null,
    },
  },
};

export const ButtonWithDimensionsAndTimeTravel = {
  render: Template,

  args: {
    activeValues: {
      dimensions: {
        "device-types": "pc",
        "customer-types": "premium",
        affiliates: "affiliate-1",
      },
      timeTravel: {
        datetime: "2023-11-11T12:30:00Z",
        timezone: UTC_NAME,
      },
    },
  },
};

export const Open = {
  render: Template,

  args: {
    activeValues: {
      dimensions: null,
      timeTravel: null,
    },
  },

  play: async () => {
    const openButton = screen.getByTestId("open-availability-picker");
    await userEvent.click(openButton);
  },
};

export const OpenWithValues = {
  render: Template,

  args: {
    activeValues: {
      dimensions: {
        "device-types": "pc",
        "customer-types": "premium",
        affiliates: "affiliate-1",
      },
      timeTravel: {
        datetime: "2023-11-11T12:30:00Z",
        timezone: UTC_NAME,
      },
    },
  },

  play: async () => {
    const openButton = screen.getByTestId("open-availability-picker");
    await userEvent.click(openButton);
  },
};
