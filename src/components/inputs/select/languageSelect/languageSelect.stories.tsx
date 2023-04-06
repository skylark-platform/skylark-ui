import { ComponentStory } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import { LanguageSelect } from "./languageSelect.component";

export default {
  title: "Components/Inputs/Select/LanguageSelect",
  component: LanguageSelect,
  argTypes: {},
};

const Template: ComponentStory<typeof LanguageSelect> = (args) => {
  return (
    <div className={clsx(args.variant === "pill" ? "w-24" : "w-96")}>
      <LanguageSelect {...args} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithSelectedLanguage = Template.bind({});
WithSelectedLanguage.args = {
  selected: "en-GB",
};
