import { ComponentStory, ComponentMeta } from "@storybook/react";
import { UserAvatar } from "./avatar.component";

export default {
  title: "Components/User/Avatar",
  component: UserAvatar,
};

const Template: ComponentStory<typeof UserAvatar> = (args) => (
  <UserAvatar {...args} />
);

export const Default = Template.bind({});
Default.args = {
  name: "Joe Bloggs",
  src: "https://images.unsplash.com/photo-1546456073-ea246a7bd25f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
};

export const NoImage = Template.bind({});
NoImage.args = {
  ...Default.args,
  src: "",
};
