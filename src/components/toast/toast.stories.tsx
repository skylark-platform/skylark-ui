import { ComponentStory } from "@storybook/react";

import { Toast, ToastContainer } from "./toast.component";

export default {
  title: "Components/Toast",
  component: ToastContainer,
  argTypes: {
    type: {
      options: ["default", "info", "success", "warning", "error"],
      control: { type: "select" },
    },
  },
};

const Template: ComponentStory<typeof Toast> = (args) => <Toast {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: "Default toast",
  message: "Toast message",
};

export const Info = Template.bind({});
Info.args = {
  title: "Information toast",
  message: "This is some useful information",
  type: "info",
};

export const Success = Template.bind({});
Success.args = {
  title: "Success toast",
  message: "The operation was successful",
  type: "success",
};

export const Warning = Template.bind({});
Warning.args = {
  title: "Warning toast",
  message: "Are you sure you want to delete this?",
  type: "warning",
};

export const Error = Template.bind({});
Error.args = {
  title: "Error toast",
  message: "Operation has failed",
  type: "error",
};
