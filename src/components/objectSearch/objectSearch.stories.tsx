import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import GQLGameOfThronesSearchResults from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";

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

  const filtersButton = canvas.getByRole("button", { name: /Filters/i });

  // Not all of the UID will be shown so just search for the first 10 characters
  const uidRegex = new RegExp(
    GQLGameOfThronesSearchResults.data.search.objects[0].uid.substring(0, 10),
    "i",
  );
  await canvas.findAllByText(uidRegex);

  await userEvent.click(filtersButton);
};

export const WithCreateButtons = Template.bind({});
WithCreateButtons.args = {
  withCreateButtons: true,
};

export const KitchenSink = Template.bind({});
KitchenSink.args = {
  withCreateButtons: true,
  withObjectSelect: true,
  withObjectEdit: true,
};