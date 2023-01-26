import { ComponentStory } from "@storybook/react";
import React from "react";

import { IconProps } from "./iconBase.component";
import * as Icons from "./index";

export default {
  title: "Components/Icons",
};

const Template: ComponentStory<React.FC<IconProps>> = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <Icons.AlertCircle {...args} />
      <Icons.CheckCircle {...args} />
      <Icons.Circle {...args} />
      <Icons.CheckSquare {...args} />
      <Icons.CrossSquare {...args} />
      <Icons.Edit {...args} />
      <Icons.InfoCircle {...args} />
      <Icons.Search {...args} />
      <Icons.Spinner {...args} />
      <Icons.Filter {...args} />
      <Icons.Expand {...args} />
      <Icons.FileText {...args} />
    </div>
  );
};

export const Default = Template.bind({});
