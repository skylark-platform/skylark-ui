import { ComponentStory } from "@storybook/react";
import React from "react";

import { LanguageSelect } from "./languageSelect.component";

export default {
  title: "Components/LanguageSelect",
  component: LanguageSelect,
  argTypes: {},
};

const Template: ComponentStory<typeof LanguageSelect> = (args) => {
  return (
    <div className="w-96">
      <LanguageSelect {...args} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {};

export const SelectedLanguage = Template.bind({});
SelectedLanguage.args = {
  selected: "en-GB",
};
