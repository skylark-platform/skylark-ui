import { StoryFn, Meta } from "@storybook/react";

import { CreateObjectModal } from "./createObjectModal.component";

const meta: Meta = {
  title: "Components/Modals/CreateObjectModal",
  component: CreateObjectModal,
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
