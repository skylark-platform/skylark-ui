import { ComponentStory, Story } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { DisplayGraphQLQuery } from "./graphQLQueryModal.component";

export default {
  title: "Components/Modals/DisplayGraphQLQuery",
  component: DisplayGraphQLQuery,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: Story) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: ComponentStory<typeof DisplayGraphQLQuery> = (args) => (
  <DisplayGraphQLQuery {...args} />
);

export const Default = Template.bind({});
Default.args = {
  label: "Schema",
  query: GET_SKYLARK_OBJECT_TYPES,
  variables: {
    variable1: "value1",
  },
};
Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const graphqlButton = canvas.getByRole("button");

  await userEvent.click(graphqlButton);

  const headlessPortalRoot = document.querySelector("#headlessui-portal-root");
  const headlessCanvas = within(headlessPortalRoot as HTMLElement);

  await waitFor(async () => {
    headlessCanvas.findAllByText("Query for Schema");
  });
};
