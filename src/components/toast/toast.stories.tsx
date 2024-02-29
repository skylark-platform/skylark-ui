import { expect } from "@storybook/jest";
import { StoryFn } from "@storybook/react";
import { userEvent, waitFor, screen, within } from "@storybook/testing-library";
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
    screen.getByTestId("toastify-loaded");
  });

  // Delay to allow ToastContainer to mount
  await sleep(1000);

  toast(<Toast {...args} />, {
    type: args.type,
    autoClose: false,
  });

  await waitFor(() => {
    expect(screen.getByText(args.title)).toBeInTheDocument();
  });

  // Delay to allow Toast to animate
  await sleep(2000);

  await userEvent.hover(screen.getByText(args.title));
};

const Template: StoryFn<typeof Toast> = () => {
  return (
    <>
      <ToastContainer />
      <span data-testid="toastify-loaded" />
    </>
  );
};

export const Default = {
  render: Template,

  args: {
    title: "Default toast",
    message: "Toast message",
  },

  play: openToastAndCheckForTitle,
};

export const Info = {
  render: Template,

  args: {
    title: "Information toast",
    message: "This is some useful information",
    type: "info",
  },

  play: openToastAndCheckForTitle,
};

export const Success = {
  render: Template,

  args: {
    title: "Success toast",
    message: "The operation was successful",
    type: "success",
  },

  play: openToastAndCheckForTitle,
};

export const Warning = {
  render: Template,

  args: {
    title: "Warning toast",
    message: "Are you sure you want to delete this?",
    type: "warning",
  },

  play: openToastAndCheckForTitle,
};

export const ErrorToast = {
  render: Template,

  args: {
    title: "Error toast",
    message: "Operation has failed",
    type: "error",
  },

  play: openToastAndCheckForTitle,
};
