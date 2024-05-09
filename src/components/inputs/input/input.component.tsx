import clsx from "clsx";
import { DetailedHTMLProps, InputHTMLAttributes } from "react";

import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";
import { InputLabel } from "src/components/inputs/label/label.component";

interface InputProps
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "onChange"
  > {
  value?: string;
  onChange: (str: string) => void;
  className?: string;
  label?: string;
  tabIndex?: number;
  withCopy?: boolean;
  placeholder?: string;
  onEnterKeyPress?: () => void;
}

export const Input = ({
  value,
  onChange,
  className,
  label,
  withCopy,
  placeholder,
  type,
  onEnterKeyPress,
  ...props
}: InputProps) => (
  <div className="relative flex flex-col w-full">
    {label && (
      <InputLabel text={label} htmlFor={label} isRequired={props.required} />
    )}
    <input
      className={clsx(
        "rounded bg-manatee-50 p-1 md:p-2",
        withCopy && "pr-6 md:pr-8",
        className,
      )}
      type={type}
      id={label}
      name={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
      <CopyToClipboard
        value={value}
        className="absolute bottom-2 right-2 md:bottom-3 md:right-3"
      />
    )}
  </div>
);

export const TextInput = (props: InputProps) => (
  <Input {...props} type="text" />
);
