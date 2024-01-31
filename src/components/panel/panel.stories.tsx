import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
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

const Template: ComponentStory<typeof Panel> = (args) => {
  return (
    <Panel
      {...args}
      closePanel={() => alert("Close clicked")}
      setPanelObject={() => ""}
      tabState={args.tabState || defaultPanelTabState}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  object: {
    uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
    objectType: "Movie",
    language: "",
  },
  tab: PanelTab.Metadata,
};

export const Metadata = Template.bind({});
Metadata.args = {
  object: {
    uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
    objectType: "Movie",
    language: "",
  },
  isPage: true,
  tab: PanelTab.Metadata,
};

export const MetadataEditing = Template.bind({});
MetadataEditing.args = {
  object: {
    uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
    objectType: "Movie",
    language: "",
  },
  isPage: true,
  tab: PanelTab.Metadata,
};
MetadataEditing.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const editButton = await canvas.findByRole("button", {
    name: /Edit Metadata/i,
  });

  await waitFor(async () => {
    userEvent.click(editButton);
  });

  const openSaveOptions = await canvas.findByLabelText(
    "save changes - see alternate options",
  );

  await waitFor(async () => {
    userEvent.click(openSaveOptions);
  });
};

export const MetadataDraft = Template.bind({});
MetadataDraft.args = {
  object: {
    uid: GQLSkylarkGetMovieDraftQueryFixture.data.getObject.uid,
    objectType: "Movie",
    language: "",
  },
  isPage: true,
  tab: PanelTab.Metadata,
};

export const MetadataDraftModeEditing = Template.bind({});
MetadataDraftModeEditing.args = {
  object: {
    uid: GQLSkylarkGetMovieDraftQueryFixture.data.getObject.uid,
    objectType: "Movie",
    language: "",
  },
  isPage: true,
  tab: PanelTab.Metadata,
};
MetadataDraftModeEditing.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const editButton = await canvas.findByRole("button", {
    name: /Edit Metadata/i,
  });

  await waitFor(async () => {
    userEvent.click(editButton);
  });

  const openSaveOptions = await canvas.findByLabelText(
    "save changes - see alternate options",
  );

  await waitFor(async () => {
    userEvent.click(openSaveOptions);
  });
};

export const Imagery = Template.bind({});
Imagery.parameters = Default.parameters;
Imagery.args = {
  ...Default.args,
  tab: PanelTab.Imagery,
};

export const Content = Template.bind({});
Content.parameters = Default.parameters;
Content.args = {
  object: {
    objectType: "SkylarkSet",
    uid: GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid,
    language: "",
  },
  tab: PanelTab.Content,
};

export const ContentEditing = Template.bind({});
ContentEditing.parameters = Default.parameters;
ContentEditing.args = {
  object: {
    objectType: "SkylarkSet",
    uid: GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid,
    language: "",
  },
  tab: PanelTab.Content,
};
ContentEditing.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const editButton = await canvas.findByRole("button", {
    name: /Edit Content/i,
  });

  await waitFor(async () => {
    userEvent.click(editButton);
  });
};

export const Relationships = Template.bind({});
Relationships.parameters = Default.parameters;
Relationships.args = {
  ...Default.args,
  object: {
    objectType: "Season",
    uid: GQLSkylarkGetSeasonQueryFixture.data.getObject.uid,
    language: "",
  },
  tab: PanelTab.Relationships,
};
export const RelationshipsExpanded = Template.bind({});
RelationshipsExpanded.parameters = Default.parameters;
RelationshipsExpanded.args = {
  ...Default.args,
  object: {
    objectType: "Season",
    uid: GQLSkylarkGetSeasonQueryFixture.data.getObject.uid,
    language: "",
  },
  tab: PanelTab.Relationships,
};
RelationshipsExpanded.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const openButton = await canvas.findByLabelText(
    "expand episodes relationship",
  );
  await userEvent.click(openButton);
};

export const Availability = Template.bind({});
Availability.parameters = Default.parameters;
Availability.args = {
  ...Default.args,
  tab: PanelTab.Availability,
};

export const AvailabilityActiveObject = Template.bind({});
AvailabilityActiveObject.parameters = Default.parameters;
AvailabilityActiveObject.args = {
  ...Default.args,
  tab: PanelTab.Availability,
};
AvailabilityActiveObject.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const openButton = await canvas.findByLabelText(
    "expand availability: Active Next Sunday @ 9PM, Europe/North America",
  );
  await userEvent.click(openButton);
};

export const AvailabilityActiveObjectInheritedBy = Template.bind({});
AvailabilityActiveObjectInheritedBy.parameters = Default.parameters;
AvailabilityActiveObjectInheritedBy.args = {
  ...Default.args,
  tab: PanelTab.Availability,
};
AvailabilityActiveObjectInheritedBy.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByLabelText(
      "expand availability: Active Next Sunday @ 9PM, Europe/North America",
    ),
  );

  await userEvent.click(canvas.getByText("Inherited by"));
};

export const AvailabilityDimensions = Template.bind({});
AvailabilityDimensions.parameters = Default.parameters;
AvailabilityDimensions.args = {
  ...Default.args,
  object: {
    objectType: "Availability",
    uid: GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid,
    language: "",
  },
  tab: PanelTab.AvailabilityDimensions,
};

export const AvailabilityAssignedTo = Template.bind({});
AvailabilityAssignedTo.parameters = Default.parameters;
AvailabilityAssignedTo.args = {
  ...Default.args,
  object: {
    objectType: "Availability",
    uid: GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid,
    language: "",
  },
  tab: PanelTab.AvailabilityAssignedTo,
};
