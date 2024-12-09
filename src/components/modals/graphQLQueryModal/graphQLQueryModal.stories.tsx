import { Meta } from "@storybook/react";
import { userEvent, waitFor, within, screen } from "@storybook/test";

import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { DisplayGraphQLQuery } from "./graphQLQueryModal.component";

const meta: Meta = {
  title: "Components/Modals/DisplayGraphQLQuery",
  component: DisplayGraphQLQuery,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

export default meta;

export const Default = {
  args: {
    label: "Schema",
    query: GET_SKYLARK_OBJECT_TYPES,
    variables: {
      variable1: "value1",
    },
  },

  play: async () => {
    const graphqlButton = screen.getByRole("button");

    await userEvent.click(graphqlButton);

    const headlessPortalRoot = document.querySelector(
      "#headlessui-portal-root",
    );
    const headlessCanvas = within(headlessPortalRoot as HTMLElement);

    await waitFor(async () => {
      headlessCanvas.findAllByText("Query for Schema");
    });
  },
};
