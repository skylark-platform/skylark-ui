import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import React from "react";

import GQLSkylarkGetAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetSeasonQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import { PanelTab } from "src/hooks/usePanelObjectState";

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

export const PageView = Template.bind({});
PageView.args = {
  object: {
    uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
    objectType: "Movie",
    language: "",
  },
  isPage: true,
  tab: PanelTab.Metadata,
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

  await canvas.findByRole("button", { name: /Edit Content/i });
  const editButton = canvas.getByRole("button", { name: /Edit Content/i });

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

export const Availability = Template.bind({});
Availability.parameters = Default.parameters;
Availability.args = {
  ...Default.args,
  tab: PanelTab.Availability,
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
