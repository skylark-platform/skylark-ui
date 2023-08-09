import { ComponentStory, Story } from "@storybook/react";

import { CreateObjectModal } from "./createObjectModal.component";

export default {
  title: "Components/Modals/CreateObjectModal",
  component: CreateObjectModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: Story) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: ComponentStory<typeof CreateObjectModal> = (args) => {
  return <CreateObjectModal {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
};

export const WithEpisodeSelected = Template.bind({});
WithEpisodeSelected.args = {
  isOpen: true,
  objectType: "Episode",
};
