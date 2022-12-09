import { ComponentStory } from "@storybook/react";

import { StatusCard, statusType } from "./statusCard.component";

export default {
  title: "Components/StatusCard",
  component: StatusCard,
  argTypes: {
    status: {
      options: statusType,
      control: { type: "select" },
    },
  },
};

const defaultProps = {
  title: "title",
  description: "lorem ipsum",
  status: statusType.pending,
  // argTypes: {
  //   status: {
  //     options: statusType,
  //     control: { type: "select" },
  //   },
  // },
};

const Template: ComponentStory<typeof StatusCard> = (args) => {
  return (
    <div className="w-80">
      <StatusCard {...args} />
    </div>
  );
};

export const Pending = Template.bind({});
Pending.args = {
  title: "Pending",
  description: "This is a future step",
  status: statusType.pending,
};

export const InProgress = Template.bind({});
InProgress.args = {
  title: "In Progress",
  description: "This step is in progress...",
  status: statusType.inProgress,
};

export const Success = Template.bind({});
Success.args = {
  title: "Success",
  description: "This step has been successful",
  status: statusType.success,
};

export const Error = Template.bind({});
Error.args = {
  title: "Error",
  description: "An error has occured",
  status: statusType.error,
};
