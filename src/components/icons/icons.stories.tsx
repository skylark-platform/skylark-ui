import { ComponentStory } from "@storybook/react";

import { statusType } from "src/components/statusCard/statusCard.component";

import { AlertCircle } from "./alertCircle.component";
import { CheckCircle } from "./checkCircle.component";
import { Circle } from "./circle.component";
import { Spinner } from "./spinner.component";

export default {
  title: "Components/Icons",
  argTypes: {
    className: {
      options: ["stroke-success", "stroke-error-2"],
      control: { type: "select" },
    },
  },
};

const defaultProps = {
  className: statusType.success,
};

const Template: ComponentStory<any> = (args) => {
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
Default.args = {
  ...defaultProps,
};
