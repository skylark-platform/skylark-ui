import { StoryFn } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import { LanguageSelect } from "./languageSelect.component";

export default {
  title: "Components/Inputs/Select/LanguageSelect",
  component: LanguageSelect,
  argTypes: {},
};

const Template: StoryFn<typeof LanguageSelect> = (args) => {
  return (
    <div className={clsx(args.variant === "pill" ? "w-24" : "w-96")}>
      <LanguageSelect {...args} />
    </div>
  );
};

export const Default = {
  render: Template,
  args: {},
};

export const WithSelectedLanguage = {
  render: Template,

  args: {
    selected: "en-GB",
  },
};
