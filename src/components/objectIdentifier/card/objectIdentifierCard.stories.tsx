import { StoryFn } from "@storybook/react";
import React from "react";

import {
  AvailabilityStatus,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import { createDefaultSkylarkObject } from "src/lib/skylark/objects";

import { ObjectIdentifierCard } from "./objectIdentifierCard.component";

export default {
  title: "Components/ObjectIdentifierCard",
  component: ObjectIdentifierCard,
  argTypes: {},
};

const object = createDefaultSkylarkObject({
  uid: "123",
  objectType: "SkylarkSet",
  language: "en-GB",
  availableLanguages: ["en-GB"],
  availabilityStatus: AvailabilityStatus.Active,
  display: {
    name: "my episode",
  },
});

const Template: StoryFn<typeof ObjectIdentifierCard> = (args) => {
  return (
    <div className="w-96">
      <ObjectIdentifierCard {...args} />
    </div>
  );
};

export const Default = {
  render: Template,

  args: {
    object,
    onDeleteClick: undefined,
    onForwardClick: undefined,
  },
};

export const WithForwardArrow = {
  render: Template,

  args: {
    object,
    onDeleteClick: undefined,
    onForwardClick: () => "",
  },
};

export const WithDeleteIcon = {
  render: Template,

  args: {
    object,
    onForwardClick: undefined,
    onDeleteClick: () => "",
  },
};

export const WithAllIcons = {
  render: Template,

  args: {
    object,
    onForwardClick: () => "",
    onDeleteClick: () => "",
  },
};

export const WithObjectTypeHidden = {
  render: Template,

  args: {
    object,
    hideObjectType: true,
  },
};

export const WithAvailabilityStatusHidden = {
  render: Template,

  args: {
    object,
    hideAvailabilityStatus: true,
  },
};

export const WithAvailabilityStatusFuture = {
  render: Template,

  args: {
    object: {
      ...object,
      availability: { status: AvailabilityStatus.Future, objects: [] },
    },
    onDeleteClick: undefined,
  },
};
