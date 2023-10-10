import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { ObjectSearch } from "./objectSearch.component";

export default {
  title: "Components/ObjectSearch",
  component: ObjectSearch,
};

const Template: ComponentStory<typeof ObjectSearch> = (args) => {
  return <ObjectSearch {...args} />;
};

export const Default = Template.bind({});

export const WithFiltersOpen = Template.bind({});
WithFiltersOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(() => {
    canvas.findAllByText("GOT Highest Rated Episodes");
  });

  const filtersButton = canvas.getByRole("button", {
    name: "Open Search Options",
  });

  await userEvent.click(filtersButton);
};

export const KitchenSink = Template.bind({});
KitchenSink.args = {
  withObjectSelect: true,
};
