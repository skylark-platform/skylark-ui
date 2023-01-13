import clsx from "clsx";

interface TextInputProps {
  value: string;
  onChange: (str: string) => void;
  className?: string;
  label?: string;
}

export const TextInput = ({
  value,
  onChange,
  className,
  label,
}: TextInputProps) => (
  <div className="flex flex-col">
    {label && (
      <label className="mb-1 text-xs text-manatee-500 md:text-sm">
        {label}
      </label>
    )}
    <input
      className={clsx("rounded bg-manatee-50 p-2", className)}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
