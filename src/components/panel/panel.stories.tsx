import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import React from "react";

import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetSetWithContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/setWithContent.json";

import { Panel } from "./panel.component";

export default {
  title: "Components/Panel",
  component: Panel,
  argTypes: {},
};

const Template: ComponentStory<typeof Panel> = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <Panel {...args} closePanel={() => alert("Close clicked")} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  objectType: "Movie",
  uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
};

export const Imagery = Template.bind({});
Imagery.parameters = Default.parameters;
Imagery.args = {
  ...Default.args,
};
Imagery.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Imagery/i });
  const tabButton = canvas.getByRole("button", { name: /Imagery/i });

  await waitFor(async () => {
    userEvent.click(tabButton);
  });
};

export const Content = Template.bind({});
Content.parameters = Default.parameters;
Content.args = {
  objectType: "Set",
  uid: GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid,
};
Content.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Content/i });
  const tabButton = canvas.getByRole("button", { name: /Content/i });

  await waitFor(async () => {
    userEvent.click(tabButton);
  });
};

export const ContentEditing = Template.bind({});
ContentEditing.parameters = Default.parameters;
ContentEditing.args = {
  objectType: "Set",
  uid: GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid,
};
ContentEditing.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Content/i });
  const tabButton = canvas.getByRole("button", { name: /Content/i });

  await waitFor(async () => {
    userEvent.click(tabButton);
  });

  await canvas.findByRole("button", { name: /Edit Content/i });
  const editButton = canvas.getByRole("button", { name: /Edit Content/i });

  await waitFor(async () => {
    userEvent.click(editButton);
  });
};

export const Availability = Template.bind({});
Availability.parameters = Default.parameters;
Availability.args = {
  ...Default.args,
};
Availability.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await canvas.findByRole("button", { name: /Availability/i });
  const imageryButton = canvas.getByRole("button", { name: /Availability/i });

  await waitFor(async () => {
    userEvent.click(imageryButton);
  });
};
