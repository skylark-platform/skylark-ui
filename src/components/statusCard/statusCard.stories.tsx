import { ComponentStory } from "@storybook/react";

import { StatusCard, statusType } from "./statusCard.component";

export default {
  title: "Components/StatusCard",
  component: StatusCard,
};

const defaultProps = {
  title: "title",
  description: "lorem ipsum",
  status: statusType.pending,
  argTypes: {
    status: {
      options: statusType,
      control: { type: "select" },
    },
  },
};

const Template: ComponentStory<any> = (args) => {
  return <StatusCard {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  ...defaultProps,
};
