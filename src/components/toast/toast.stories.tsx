import { ComponentStory } from "@storybook/react";
import { toast } from "react-toastify";

import { Toast, ToastContainer } from "./toast.component";

export default {
  title: "Components/Toast",
  component: ToastContainer,
};

const Template: ComponentStory<typeof ToastContainer> = () => (
  <ToastContainer />
);

export const Default = Template.bind({});
Default.play = async () => {
  toast(
    <Toast
      title="Connections confirmed"
      message="Connection modifications saved to GOT S01"
    />,
  );
};

export const Multiple = Template.bind({});
Multiple.play = async () => {
  toast(<Toast title="Default" message="This is the default toast" />);
  toast.info(<Toast title="Info" message="This is an information toast" />);
  toast.success(
    <Toast title="Success" message="The operation was a success!" />,
  );
  toast.warning(
    <Toast title="Warning" message="You're almost over your limit" />,
  );
  toast.error(<Toast title="Error" message="Operation failed" />);
};

// export const Success = Template.bind({});
// Success.play = async () => {
//   toast.success("Success");
// };
