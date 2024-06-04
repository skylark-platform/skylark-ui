import { Pill } from "./pill.component";

export default {
  title: "Components/Pill",
  component: Pill,
};

export const Default = {
  args: {
    label: "Episode",
    bgColor: "orange",
    onDelete: undefined,
  },
};

export const WithClose = {
  args: {
    label: "Episode",
    bgColor: "orange",
    onDelete: () => "",
  },
};
