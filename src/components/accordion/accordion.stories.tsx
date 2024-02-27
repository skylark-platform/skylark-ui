import { Accordion } from "./accordion.component";

export default { component: Accordion };
export const Default = {
  args: {
    buttonText: "My Accordion",
    children: <>My accordion text</>,
    defaultOpen: true,
  },
};

export const Closed = {
  ...Default,
  args: { ...Default.args, defaultOpen: false },
};

export const Success = {
  ...Default,
  args: { ...Default.args, isSuccess: true },
};

export const Error = {
  ...Default,
  args: { ...Default.args, isError: true },
};

export const Warning = {
  ...Default,
  args: { ...Default.args, isWarning: true },
};
