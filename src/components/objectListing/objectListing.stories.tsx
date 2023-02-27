import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import GQLGameOfThronesSearchResults from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";

import { ObjectList } from "./objectListing.component";

export default {
  title: "Components/ObjectListing",
  component: ObjectList,
};

const Template: ComponentStory<typeof ObjectList> = (args) => {
  return <ObjectList {...args} />;
};

export const Default = Template.bind({});

export const WithFiltersOpen = Template.bind({});
WithFiltersOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const filtersButton = canvas.getByRole("button", { name: /Filters/i });

  await canvas.findAllByText(
    GQLGameOfThronesSearchResults.data.search.objects[0]
      .__Episode__title as string,
  );

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
