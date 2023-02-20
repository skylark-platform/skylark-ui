import { CheckedState } from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { useEffect, useState } from "react";

import { Checkbox } from "src/components/checkbox";

interface CheckboxGridProps {
  label: string;
  options: {
    [option: string]: CheckedState;
  };
  className?: string;
  withToggleAll?: boolean;
  onChange: (checkedOptions: string[]) => void;
}

export const createCheckboxOptions = (
  options: string[],
  activeOptions: string[],
): { [option: string]: CheckedState } => {
  const obj = options.reduce(
    (prev, option) => ({ ...prev, [option]: activeOptions.includes(option) }),
    {},
  );
  return obj;
};

export const CheckboxGrid = ({
  label,
  options,
  className,
  withToggleAll,
  onChange,
}: CheckboxGridProps) => {
  const [checkboxOptions, setCheckboxOptions] = useState(options);

  const allOptionsChecked = Object.values(checkboxOptions).every(
    (val) => !!val,
  );

  const handleChange = (option: string, checkedState: CheckedState) => {
    const updatedOptions = { ...checkboxOptions, [option]: checkedState };
    setCheckboxOptions(updatedOptions);
    const optsArr = Object.keys(updatedOptions).filter(
      (option) => !!updatedOptions[option],
    );
    onChange(optsArr);
  };

  const handleToggleAll = () => {
    const strOptions = Object.keys(checkboxOptions);
    const updatedOptions = createCheckboxOptions(
      strOptions,
      allOptionsChecked ? [] : strOptions,
    );
    setCheckboxOptions(updatedOptions);

    const optsArr = Object.keys(updatedOptions).filter(
      (option) => !!updatedOptions[option],
    );
    onChange(optsArr);
  };

  useEffect(() => {
    setCheckboxOptions(options);
  }, [options]);

  return (
    <section
      className={clsx("flex flex-col space-y-1.5 text-xs", className)}
      data-testid={`checkbox-grid-${label}`}
    >
      <h4 className="mb-0.5 select-none font-semibold text-manatee-600">
        {label}
      </h4>
      {withToggleAll && (
        <Checkbox
          label="Toggle all"
          onCheckedChange={handleToggleAll}
          name={`toggle-all-${label}`}
          checked={allOptionsChecked}
        />
      )}
      <div className="grid grid-cols-2 space-y-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
        {Object.keys(checkboxOptions).map((option) => (
          <Checkbox
            label={option}
            key={option}
            name={option}
            checked={checkboxOptions[option]}
            onCheckedChange={(checkedState) =>
              handleChange(option, checkedState)
            }
          />
        ))}
      </div>
    </section>
  );
};
