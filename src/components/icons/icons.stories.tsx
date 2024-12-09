import { StoryFn } from "@storybook/react";
import React from "react";

import { IconProps } from "./iconBase.component";
import * as Icons from "./index";

export default {
  title: "Components/Icons",
};

const Template: StoryFn = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <Icons.Spinner {...args} />
      <Icons.Filter {...args} />
    </div>
  );
};

export const Default = {
  render: Template,
};
