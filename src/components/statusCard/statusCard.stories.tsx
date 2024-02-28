import { StoryFn } from "@storybook/react";

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

const Template: StoryFn<typeof StatusCard> = (args) => {
  return (
    <div className="w-80">
      <StatusCard {...args} />
    </div>
  );
};

export const Pending = {
  render: Template,

  args: {
    title: "Pending",
    description: "This is a future step",
    status: statusType.pending,
  },
};

export const InProgress = {
  render: Template,

  args: {
    title: "In Progress",
    description: "This step is in progress...",
    status: statusType.inProgress,
  },
};

export const Success = {
  render: Template,

  args: {
    title: "Success",
    description: "This step has been successful",
    status: statusType.success,
  },
};

export const Error = {
  render: Template,

  args: {
    title: "Error",
    description: "An error has occured",
    status: statusType.error,
  },
};
