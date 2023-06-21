import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Toast, ToastContainer, ToastProps } from "./toast.component";

const sleep = (timeMs: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

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

const openToastAndCheckForTitle = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: ToastProps;
}) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    canvas.getByTestId("toastify-loaded");
  });

  // Delay to allow ToastContainer to mount
  await sleep(1000);

  toast(<Toast {...args} />, {
    type: args.type,
    autoClose: false,
  });

  await waitFor(async () => {
    await userEvent.hover(canvas.getByText(args.title));
  });
};

const Template: ComponentStory<typeof Toast> = () => {
  return (
    <>
      <ToastContainer />
      <span data-testid="toastify-loaded" />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  title: "Default toast",
  message: "Toast message",
};
Default.play = openToastAndCheckForTitle;

export const Info = Template.bind({});
Info.args = {
  title: "Information toast",
  message: "This is some useful information",
  type: "info",
};
Info.play = openToastAndCheckForTitle;

export const Success = Template.bind({});
Success.args = {
  title: "Success toast",
  message: "The operation was successful",
  type: "success",
};
Success.play = openToastAndCheckForTitle;

export const Warning = Template.bind({});
Warning.args = {
  title: "Warning toast",
  message: "Are you sure you want to delete this?",
  type: "warning",
};
Warning.play = openToastAndCheckForTitle;

export const ErrorToast = Template.bind({});
ErrorToast.args = {
  title: "Error toast",
  message: "Operation has failed",
  type: "error",
};
ErrorToast.play = openToastAndCheckForTitle;
