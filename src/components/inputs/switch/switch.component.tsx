import { Switch as HeadlessUiSwitch } from "@headlessui/react";
import clsx from "clsx";

interface SwitchProps {
  size?: "small";
  enabled: boolean;
  onChange: (b: boolean) => void;
}

const sizeClassNames = {
  default: {
    container: "h-6 w-11",
    dot: "h-4 w-4",
    translate: {
      enabled: "translate-x-6",
      disabled: "translate-x-1",
    },
  },
  small: {
    container: "h-4 w-6",
    dot: "h-3 w-3",
    translate: {
      enabled: "translate-x-2.5",
      disabled: "translate-x-0.5",
    },
  },
};

export const Switch = ({ size, enabled, onChange }: SwitchProps) => {
  const classNames = size ? sizeClassNames[size] : sizeClassNames.default;

  return (
    <HeadlessUiSwitch
      checked={enabled}
      onChange={onChange}
      className={clsx(
        "relative inline-flex items-center rounded-full",
        enabled ? "bg-brand-primary" : "bg-gray-200",
        classNames.container,
      )}
    >
      <span
        className={clsx(
          "inline-block transform rounded-full bg-white transition",
          classNames.dot,
          enabled
            ? classNames.translate.enabled
            : classNames.translate.disabled,
        )}
      />
    </HeadlessUiSwitch>
  );
};
