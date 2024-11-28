import { StoryFn } from "@storybook/react";
import { screen, userEvent, waitFor } from "@storybook/testing-library";
import React from "react";

import GQLSkylarkGetAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetMovieDraftQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/draftObject.json";
import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetSeasonQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import { PanelTab, defaultPanelTabState } from "src/hooks/state";

import { Panel } from "./panel.component";

export default {
  title: "Components/Panel",
  component: Panel,
  argTypes: {},
};

const Template: StoryFn<typeof Panel> = (args) => {
  return (
    <Panel
      {...args}
      closePanel={() => alert("Close clicked")}
      setPanelObject={() => ""}
      tabState={args.tabState || defaultPanelTabState}
    />
  );
};

export const Default = {
  render: Template,
  args: {
    object: {
      uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
      objectType: "Movie",
      language: "",
    },
    tab: PanelTab.Metadata,
  },
};

export const Metadata = {
  render: Template,
  args: {
    object: {
      uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
      objectType: "Movie",
      language: "",
    },
    isPage: true,
    tab: PanelTab.Metadata,
  },
};

export const MetadataEditing = {
  render: Template,

  args: {
    object: {
      uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
      objectType: "Movie",
      language: "",
    },
    isPage: true,
    tab: PanelTab.Metadata,
  },

  play: async () => {
    const editButton = await screen.findByRole("button", {
      name: /Edit Metadata/i,
    });

    await waitFor(async () => {
      userEvent.click(editButton);
    });

    const openSaveOptions = await screen.findByLabelText(
      "save changes - see alternate options",
    );

    await waitFor(async () => {
      userEvent.click(openSaveOptions);
    });
  },
};

export const MetadataDraft = {
  render: Template,

  args: {
    object: {
      uid: GQLSkylarkGetMovieDraftQueryFixture.data.getObject.uid,
      objectType: "Movie",
      language: "",
    },
    isPage: true,
    tab: PanelTab.Metadata,
  },
};

export const MetadataDraftModeEditing = {
  render: Template,

  args: {
    object: {
      uid: GQLSkylarkGetMovieDraftQueryFixture.data.getObject.uid,
      objectType: "Movie",
      language: "",
    },
    isPage: true,
    tab: PanelTab.Metadata,
  },

  play: async () => {
    const editButton = await screen.findByRole("button", {
      name: /Edit Metadata/i,
    });

    await waitFor(async () => {
      userEvent.click(editButton);
    });

    const openSaveOptions = await screen.findByLabelText(
      "save changes - see alternate options",
    );

    await waitFor(async () => {
      userEvent.click(openSaveOptions);
    });
  },
};

export const Imagery = {
  render: Template,
  args: {
    ...Default.args,
    tab: PanelTab.Imagery,
  },
};

export const Content = {
  render: Template,
  args: {
    object: {
      objectType: "SkylarkSet",
      uid: GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid,
      language: "",
    },
    tab: PanelTab.Content,
  },
};

export const ContentEditing = {
  render: Template,
  args: {
    object: {
      objectType: "SkylarkSet",
      uid: GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid,
      language: "",
    },
    tab: PanelTab.Content,
  },

  play: async () => {
    const editButton = await screen.findByRole("button", {
      name: /Edit Content/i,
    });

    await waitFor(async () => {
      userEvent.click(editButton);
    });
  },
};

export const Relationships = {
  render: Template,
  args: {
    ...Default.args,
    object: {
      objectType: "Season",
      uid: GQLSkylarkGetSeasonQueryFixture.data.getObject.uid,
      language: "",
    },
    tab: PanelTab.Relationships,
  },
};

export const RelationshipsExpanded = {
  render: Template,
  args: {
    ...Default.args,
    object: {
      objectType: "Season",
      uid: GQLSkylarkGetSeasonQueryFixture.data.getObject.uid,
      language: "",
    },
    tab: PanelTab.Relationships,
  },

  play: async () => {
    const openButton = await screen.findByLabelText(
      "expand episodes relationship",
    );
    await userEvent.click(openButton);
  },
};

export const Availability = {
  render: Template,
  args: {
    ...Default.args,
    tab: PanelTab.Availability,
  },
};

export const AvailabilityActiveObject = {
  render: Template,
  args: {
    ...Default.args,
    tab: PanelTab.Availability,
  },

  play: async () => {
    const openButton = await screen.findByLabelText(
      "expand availability: Active Next Sunday @ 9PM, Europe/North America",
    );
    await userEvent.click(openButton);
  },
};

export const AvailabilityActiveObjectInheritedBy = {
  render: Template,
  args: {
    ...Default.args,
    tab: PanelTab.Availability,
  },

  play: async () => {
    await userEvent.click(
      await screen.findByLabelText(
        "expand availability: Active Next Sunday @ 9PM, Europe/North America",
      ),
    );

    await userEvent.click(screen.getByText("Inherited by"));
  },
};

export const AvailabilityDimensions = {
  render: Template,
  args: {
    ...Default.args,
    object: {
      objectType: "Availability",
      uid: GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid,
      language: "",
    },
    tab: PanelTab.AvailabilityAudience,
  },
};

export const AvailabilityAssignedTo = {
  render: Template,
  args: {
    ...Default.args,
    object: {
      objectType: "Availability",
      uid: GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid,
      language: "",
    },
    tab: PanelTab.AvailabilityAssignedTo,
  },
};
