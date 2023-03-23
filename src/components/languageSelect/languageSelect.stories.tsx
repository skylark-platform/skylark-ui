import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
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

export const PreselectedLanguage = Template.bind({});
PreselectedLanguage.args = {
  initialValue: "en-GB",
};
