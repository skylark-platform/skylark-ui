import { StoryFn } from "@storybook/react";
import { userEvent, waitFor, screen } from "@storybook/test";

import { ObjectSearch } from "./objectSearch.component";

export default {
  title: "Components/ObjectSearch",
  component: ObjectSearch,
};

const Template: StoryFn<typeof ObjectSearch> = (args) => {
  return <ObjectSearch {...args} />;
};

export const Default = {
  render: Template,
};

export const WithFiltersOpen = {
  render: Template,

  play: async () => {
    await waitFor(() => {
      screen.findAllByText("GOT Highest Rated Episodes");
    });

    const filtersButton = screen.getByRole("button", {
      name: "Open Search Options",
    });

    await userEvent.click(filtersButton);
  },
};

export const KitchenSink = {
  render: Template,

  args: {
    withObjectSelect: true,
  },
};
