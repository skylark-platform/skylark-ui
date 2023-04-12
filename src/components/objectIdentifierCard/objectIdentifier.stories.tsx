import { ComponentStory } from "@storybook/react";
import React from "react";

import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
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
};

export const WithForwardClickArrow = Template.bind({});
WithForwardClickArrow.args = {
  object,
  onForwardClick: () => console.log("clicked"),
};
