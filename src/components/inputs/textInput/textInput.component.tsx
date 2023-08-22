import clsx from "clsx";

import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";

interface TextInputProps {
  value: string;
  onChange: (str: string) => void;
  className?: string;
  label?: string;
  tabIndex?: number;
  withCopy?: boolean;
  onEnterKeyPress?: () => void;
}

export const TextInput = ({
  value,
  onChange,
  className,
  label,
  withCopy,
  onEnterKeyPress,
  ...props
}: TextInputProps) => (
  <div className="relative flex flex-col">
    {label && (
      <label
        className="mb-1 text-xs text-manatee-500 md:text-sm"
        htmlFor={label}
      >
        {label}
      </label>
    )}
    <input
      className={clsx("rounded bg-manatee-50 p-1 md:p-2", className)}
      type="text"
      id={label}
      name={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={
        onEnterKeyPress
          ? (e) => {
              if (e.key === "Enter") {
                onEnterKeyPress();
              }
            }
          : undefined
      }
      {...props}
    />
    {withCopy && (
      <CopyToClipboard value={value} className="absolute right-3 top-9" />
    )}
  </div>
);
