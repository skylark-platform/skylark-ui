import { CheckedState } from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { ElementType } from "react";

import { Checkbox } from "src/components/inputs/checkbox";

export type CheckboxOption = {
  label: string;
  value: string;
};

export type CheckboxOptionState = {
  option: CheckboxOption;
  state: CheckedState;
};

interface CheckboxGridToggleAllProps {
  name: string;
  options: CheckboxOptionState[];
  checkedOptions: string[];
  onChange: (checkedOptions: string[]) => void;
}

export interface CheckboxGridProps {
  as?: ElementType;
  label: string;
  hideLabel?: boolean;
  options: CheckboxOptionState[];
  checkedOptions: string[];
  className?: string;
  withToggleAll?: boolean;
  onChange: (checkedOptions: string[]) => void;
}

export const createCheckboxOptions = (
  options: CheckboxOption[],
  activeOptions: string[],
): CheckboxOptionState[] => {
  return options.map(
    (option): CheckboxOptionState => ({
      option,
      state: activeOptions.includes(option.value),
    }),
  );
};

export const CheckboxGridToggleAll = ({
  name,
  options,
  checkedOptions,
  onChange,
}: CheckboxGridToggleAllProps) => {
  const values = options.map(({ option: { value } }) => value);

  const allOptionsChecked = options.every(({ option }) =>
    checkedOptions.includes(option.value),
  );

  const handleToggleAll = () => {
    onChange(
      allOptionsChecked
        ? checkedOptions.filter((option) => !values.includes(option))
        : [...new Set([...checkedOptions, ...values])],
    );
  };

  return (
    <Checkbox
      label="Toggle all"
      className="mb-2"
      onCheckedChange={handleToggleAll}
      name={name}
      checked={allOptionsChecked}
    />
  );
};

export const CheckboxGrid = ({
  as,
  label,
  hideLabel,
  className,
  withToggleAll,
  options,
  checkedOptions,
  onChange,
}: CheckboxGridProps) => {
  const handleChange = (option: CheckboxOption, checkedState: CheckedState) => {
    const updatedCheckedOptions = checkedState
      ? [...checkedOptions, option.value]
      : checkedOptions.filter((value) => value !== option.value);
    onChange(updatedCheckedOptions);
  };

  const handleToggleOnly = (onlyOption: CheckboxOption) => {
    onChange([onlyOption.value]);
  };

  const El = as || "div";

  return (
    <El
      className={clsx("flex flex-col text-xs", className)}
      data-testid={`checkbox-grid-${label?.split(" ").join("-").toLowerCase()}`}
    >
      {!hideLabel && (
        <h4 className="mb-2 select-none font-semibold text-manatee-600">
          {label}
        </h4>
      )}
      {withToggleAll && (
        <CheckboxGridToggleAll
          onChange={onChange}
          name={`toggle-all-${label}`}
          options={options}
          checkedOptions={checkedOptions}
        />
      )}
      <div className="grid columns-2 space-y-2 md:columns-4 lg:columns-5 xl:columns-6">
        {options.map(({ option }) => (
          <Checkbox
            label={option.label}
            key={option.value}
            name={`${label}-${option.value}`}
            checked={checkedOptions.includes(option.value)}
            onCheckedChange={(checkedState) =>
              handleChange(option, checkedState)
            }
            onOnlyClick={() => handleToggleOnly(option)}
          />
        ))}
      </div>
    </El>
  );
};
