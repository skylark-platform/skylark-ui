import { StoryFn } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import {
  AvailabilityStatus,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";

import { BatchDeleteObjectsModal } from "./batchDeleteObjectsModal.component";

const object: ParsedSkylarkObject = {
  uid: "123",
  objectType: "Episode",
  meta: {
    language: "en-GB",
    availableLanguages: ["en-GB"],
    availabilityStatus: AvailabilityStatus.Active,
    versions: {},
  },
  metadata: {
    uid: "123",
    external_id: "",
    title: "My Episode",
  },
  config: { primaryField: "title" },
  availability: {
    status: AvailabilityStatus.Active,
    objects: [],
  },
};

export default {
  title: "Components/Modals/BatchDeleteObjectsModal",
  component: BatchDeleteObjectsModal,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: StoryFn) => (
      <div className="h-screen w-screen">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: StoryFn<typeof BatchDeleteObjectsModal> = (args) => {
  return <BatchDeleteObjectsModal {...args} />;
};

export const Default = {
  render: Template,

  args: {
    isOpen: true,
    closeModal: () => "",
    objectsToBeDeleted: [
      object,
      {
        ...object,
        objectType: "Movie",
        uid: "246",
        metadata: { uid: "246", external_id: "", title: "My Movie" },
      },
    ],
  },
};

export const Confirmation = {
  render: Template,

  args: {
    isOpen: true,
    closeModal: () => "",
    objectsToBeDeleted: [
      object,
      {
        ...object,
        objectType: "Movie",
        uid: "246",
        metadata: { uid: "246", external_id: "", title: "My Movie" },
      },
    ],
  },

  play: async () => {
    const headlessPortalRoot = document.querySelector(
      "#headlessui-portal-root",
    );
    const headlessCanvas = within(headlessPortalRoot as HTMLElement);

    const buttom = await headlessCanvas.findByText("Delete objects");
    await userEvent.click(buttom);

    await headlessCanvas.findByPlaceholderText(/permanently delete/);
  },
};
