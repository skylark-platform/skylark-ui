import { ComponentStory, Story } from "@storybook/react";

import { DeleteObjectModal } from "./deleteObjectModal.component";

export default {
  title: "Components/Modals/DeleteObjectModal",
  component: DeleteObjectModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: Story) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: ComponentStory<typeof DeleteObjectModal> = (args) => {
  return <DeleteObjectModal {...args} />;
};

export const WithNoLanguage = Template.bind({});
WithNoLanguage.args = {
  isOpen: true,
  uid: "123",
  objectType: "Availability",
  objectDisplayName: "Always Availability",
  objectTypeDisplayName: "Availability Rule",
};

export const WithSingleAvailableLanguage = Template.bind({});
WithSingleAvailableLanguage.args = {
  isOpen: true,
  uid: "123",
  objectType: "Episode",
  language: "en-GB",
  objectDisplayName: "GOT S01E01",
  objectTypeDisplayName: "Episode",
  availableLanguages: ["en-GB"],
};

export const WithMultipleAvailableLanguages = Template.bind({});
WithMultipleAvailableLanguages.args = {
  isOpen: true,
  uid: "123",
  objectType: "Episode",
  language: "en-GB",
  objectDisplayName: "GOT S01E01",
  objectTypeDisplayName: "Episode",
  availableLanguages: ["en-GB", "pt-PT"],
};
