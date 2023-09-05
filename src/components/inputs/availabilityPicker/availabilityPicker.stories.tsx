import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import clsx from "clsx";

import { UTC_NAME } from "src/components/inputs/select";

import { AvailabilityPicker } from "./availabilityPicker.component";

export default {
  title: "Components/Inputs/AvailabilityPicker",
  component: AvailabilityPicker,
};

const Template: ComponentStory<typeof AvailabilityPicker> = (args) => {
  return (
    <div className={clsx("w-96")}>
      <AvailabilityPicker {...args} />
    </div>
  );
};

export const Button = Template.bind({});
Button.args = {
  activeValues: {
    dimensions: null,
    timeTravel: null,
  },
};

export const ButtonWithDimensions = Template.bind({});
ButtonWithDimensions.args = {
  activeValues: {
    dimensions: {
      "device-types": "pc",
      "customer-types": "premium",
      affiliates: "affiliate-1",
    },
    timeTravel: null,
  },
};

export const ButtonWithDimensionsAndTimeTravel = Template.bind({});
ButtonWithDimensionsAndTimeTravel.args = {
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
};

export const Open = Template.bind({});
Open.args = {
  activeValues: {
    dimensions: null,
    timeTravel: null,
  },
};
Open.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const openButton = canvas.getByTestId("open-availability-picker");
  await userEvent.click(openButton);
};

export const OpenWithValues = Template.bind({});
OpenWithValues.args = {
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
};
OpenWithValues.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const openButton = canvas.getByTestId("open-availability-picker");
  await userEvent.click(openButton);
};
