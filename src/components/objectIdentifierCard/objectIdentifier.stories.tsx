import { StoryFn } from "@storybook/react";
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
