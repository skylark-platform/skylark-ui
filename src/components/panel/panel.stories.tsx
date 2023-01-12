import { ComponentStory } from "@storybook/react";
import React from "react";

import { Panel } from "./panel.component";

export default {
  title: "Components/Panel",
  component: Panel,
  argTypes: {},
};

const Template: ComponentStory<React.FC<any>> = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <Panel {...args} />
    </div>
  );
};

export const Default = Template.bind({
  objectType: "",
  uid: "",
  togglePanel: () => {
    return;
  },
});
