import { StoryFn } from "@storybook/react";

import { DeleteObjectModal } from "./deleteObjectModal.component";

export default {
  title: "Components/Modals/DeleteObjectModal",
  component: DeleteObjectModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: StoryFn) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: StoryFn<typeof DeleteObjectModal> = (args) => {
  return <DeleteObjectModal {...args} />;
};

export const WithNoLanguage = {
  render: Template,

  args: {
    isOpen: true,
    uid: "123",
    objectType: "Availability",
    objectDisplayName: "Always Availability",
    objectTypeDisplayName: "Availability Rule",
  },
};

export const WithSingleAvailableLanguage = {
  render: Template,

  args: {
    isOpen: true,
    uid: "123",
    objectType: "Episode",
    language: "en-GB",
    objectDisplayName: "GOT S01E01",
    objectTypeDisplayName: "Episode",
    availableLanguages: ["en-GB"],
  },
};

export const WithMultipleAvailableLanguages = {
  render: Template,

  args: {
    isOpen: true,
    uid: "123",
    objectType: "Episode",
    language: "en-GB",
    objectDisplayName: "GOT S01E01",
    objectTypeDisplayName: "Episode",
    availableLanguages: ["en-GB", "pt-PT"],
  },
};
