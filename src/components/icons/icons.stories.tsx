import { ComponentStory } from "@storybook/react";

import { statusType } from "src/components/statusCard/statusCard.component";

import { AlertCircle } from "./alertCircle.component";
import { CheckCircle } from "./checkCircle.component";
import { Circle } from "./circle.component";

export default {
  title: "Components/Icons",
  // component: CheckCircle,
  argTypes: {
    status: {
      options: statusType,
      control: { type: "select" },
    },
  },
};

const defaultProps = {
  status: statusType.success,
};

const Template: ComponentStory<any> = (args) => {
  return (
    <>
      <CheckCircle {...args} />
      <Circle {...args} />
      <AlertCircle {...args} />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  ...defaultProps,
};

/*
export const Default = (args) => (
  <>
    <CheckCircle {...defaultProps} />
    <Circle {...defaultProps} />
    <AlertCircle {...defaultProps} />
  </>
);
*/
