import { ComponentStory } from "@storybook/react";

import { SkylarkObjectFieldInput } from "./skylarkObjectFieldInput.component";

export default {
  title: "Components/Inputs/SkylarkObjectFieldInput",
  component: SkylarkObjectFieldInput,
};

const Template: ComponentStory<typeof SkylarkObjectFieldInput> = (args) => (
  <SkylarkObjectFieldInput {...args} />
);

export const Default = Template.bind({});
Default.args = {};
