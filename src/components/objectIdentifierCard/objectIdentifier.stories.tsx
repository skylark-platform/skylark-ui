import { ComponentStory } from "@storybook/react";
import React from "react";

import { ParsedSkylarkObject } from "src/interfaces/skylark";

import { ObjectIdentifierCard } from "./objectIdentifier.component";

export default {
  title: "Components/ObjectIdentifierCard",
  component: ObjectIdentifierCard,
  argTypes: {},
};

const object = {
  uid: "123",
  objectType: "SkylarkSet",
  config: {
    objectTypeDisplayName: null,
  },
  meta: {
    language: "en-GB",
  },
  metadata: {
    title: "my episode",
  },
} as unknown as ParsedSkylarkObject;

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
  onForwardClick: () => console.log("clicked"),
};

export const WithDeleteIcon = Template.bind({});
WithDeleteIcon.args = {
  object,
  onForwardClick: undefined,
  onDeleteClick: () => console.log("clicked"),
};

export const WithAllIcons = Template.bind({});
WithAllIcons.args = {
  object,
  onForwardClick: () => console.log("clicked"),
  onDeleteClick: () => console.log("clicked"),
};
