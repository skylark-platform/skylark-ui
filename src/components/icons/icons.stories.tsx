import { ComponentStory } from "@storybook/react";
import React from "react";

import { AlertCircle } from "./alertCircle.component";
import { CheckCircle } from "./checkCircle.component";
import { Circle } from "./circle.component";
import { IconProps } from "./iconBase.component";
import { Spinner } from "./spinner.component";

export default {
  title: "Components/Icons",
};

const Template: ComponentStory<React.FC<IconProps>> = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <CheckCircle {...args} />
      <Circle {...args} />
      <AlertCircle {...args} />
      <Spinner {...args} />
    </div>
  );
};

export const Default = Template.bind({});
