import { ComponentStory } from "@storybook/react";
import React from "react";

import {
  AvailabilityStatus,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";

import { ObjectIdentifierCard } from "./objectIdentifier.component";

export default {
  title: "Components/ObjectIdentifierCard",
  component: ObjectIdentifierCard,
  argTypes: {},
};

const object: ParsedSkylarkObject = {
  uid: "123",
  objectType: "SkylarkSet",
  config: {
    objectTypeDisplayName: undefined,
  },
  meta: {
    language: "en-GB",
    availableLanguages: ["en-GB"],
    availabilityStatus: AvailabilityStatus.Active,
  },
  metadata: {
    uid: "1",
    external_id: "epi-1",
    title: "my episode",
  },
  availability: {
    status: AvailabilityStatus.Active,
    objects: [],
  },
};

const Template: ComponentStory<typeof ObjectIdentifierCard> = (args) => {
  return (
    <div className="w-96">
      <ObjectIdentifierCard {...args} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  object,
  onDeleteClick: undefined,
  onForwardClick: undefined,
};

export const WithForwardArrow = Template.bind({});
WithForwardArrow.args = {
  object,
  onDeleteClick: undefined,
  onForwardClick: () => "",
};

export const WithDeleteIcon = Template.bind({});
WithDeleteIcon.args = {
  object,
  onForwardClick: undefined,
  onDeleteClick: () => "",
};

export const WithAllIcons = Template.bind({});
WithAllIcons.args = {
  object,
  onForwardClick: () => "",
  onDeleteClick: () => "",
};

export const WithObjectTypeHidden = Template.bind({});
WithObjectTypeHidden.args = {
  object,
  hideObjectType: true,
};

export const WithAvailabilityStatusHidden = Template.bind({});
WithAvailabilityStatusHidden.args = {
  object,
  hideAvailabilityStatus: true,
};

export const WithAvailabilityStatusFuture = Template.bind({});
WithAvailabilityStatusFuture.args = {
  object: {
    ...object,
    availability: { status: AvailabilityStatus.Future, objects: [] },
  },
  onDeleteClick: undefined,
};
