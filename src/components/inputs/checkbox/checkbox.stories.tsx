import { Checkbox } from "./checkbox.component";

export default {
  title: "Components/Inputs/Checkbox",
  component: Checkbox,
};

export const Default = {
  args: {},
};

export const Checked = {
  args: {
    checked: true,
  },
};

export const Disabled = {
  args: { disabled: true },
};

export const DisabledChecked = {
  args: {
    checked: true,
    disabled: true,
  },
};
