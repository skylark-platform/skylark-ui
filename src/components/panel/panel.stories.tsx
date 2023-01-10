import { ComponentStory } from "@storybook/react";
import React from "react";

import { Panel } from "./panel.component";

export default {
  title: "Components/Icons",
};

const Template: ComponentStory<React.FC<any>> = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <Panel isOpen />
    </div>
  );
};

export const Default = Template.bind({});
