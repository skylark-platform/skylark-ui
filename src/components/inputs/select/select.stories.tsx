import { StoryFn, Meta } from "@storybook/react";
import { userEvent, waitFor, screen } from "@storybook/test";
import clsx from "clsx";

import { Select } from "./select.component";

const meta: Meta<typeof Select> = {
  title: "Components/Inputs/Select",
  component: Select,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (Story) => (
      <div style={{ height: "300px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

const options = ["Episode", "Season", "Brand"].map((val) => ({
  label: val,
  value: val,
}));

const Template: StoryFn<typeof Select> = (args) => {
  return (
    <div className={clsx(args.variant === "pill" ? "w-28" : "w-96")}>
      <Select {...args} onChange={() => ""} />
    </div>
  );
};

export const Default = {
  render: Template,

  args: {
    options,
  },
};

export const WithSelected = {
  render: Template,

  args: {
    options,
    selected: options[0].value,
  },
};

export const WithLabel = {
  render: Template,

  args: {
    label: "Select Object Type",
    options,
  },
};

export const WithFormLabel = {
  render: Template,

  args: {
    label: "Select Object Type",
    labelVariant: "form",
    options,
  },
};

export const Rounded = {
  render: Template,

  args: {
    options,
    rounded: true,
  },
};

export const WithSearch = {
  render: Template,

  args: {
    options,
    searchable: true,
  },
};

export const WithoutSearch = {
  render: Template,

  args: {
    options,
    searchable: false,
  },
};

export const Pill = {
  render: Template,

  args: {
    options,
    variant: "pill",
  },
};

export const OpenWithoutSearch = {
  render: Template,

  args: {
    options,
    searchable: false,
  },

  play: async () => {
    const selectButton = screen.getByRole("button");
    await userEvent.click(selectButton);

    await waitFor(async () => {
      // Select uses a Portal so isn't screen the screenElement
      await userEvent.hover(screen.getByText("Season"));
    });
  },
};

export const OpenWithSearch = {
  render: Template,

  args: {
    options,
    searchable: true,
  },

  play: async () => {
    const selectButton = screen.getByRole("button");
    await userEvent.click(selectButton);

    await waitFor(async () => {
      // Select uses a Portal so isn't screen the screenElement
      await userEvent.hover(screen.getByText("Season"));
    });
  },
};

export const OpenWithSearchNothingFound = {
  render: Template,

  args: {
    options,
    searchable: true,
  },

  play: async () => {
    await waitFor(async () => {
      const textInput = screen.getByRole("combobox");
      await userEvent.type(textInput, "custominput");
    });
  },
};

export const OpenWithSearchCustomValue = {
  render: Template,

  args: {
    options,
    searchable: true,
    allowCustomValue: true,
  },

  play: async () => {
    await waitFor(async () => {
      const textInput = screen.getByRole("combobox");
      await userEvent.type(textInput, "custominput");
    });
  },
};
