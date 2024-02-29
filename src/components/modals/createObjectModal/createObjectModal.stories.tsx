import { StoryFn } from "@storybook/react";

import { CreateObjectModal } from "./createObjectModal.component";

export default {
  title: "Components/Modals/CreateObjectModal",
  component: CreateObjectModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: StoryFn) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: StoryFn<typeof CreateObjectModal> = (args) => {
  return <CreateObjectModal {...args} />;
};

export const Default = {
  render: Template,

  args: {
    isOpen: true,
  },
};

export const WithEpisodeSelected = {
  render: Template,

  args: {
    isOpen: true,
    objectType: "Episode",
  },
};
