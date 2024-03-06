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
      className="mb-1"
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
      <div
        className={clsx(
          // Safari seems to have a bug where if you have blank columns, they do a weird half overflow
          // So if you have 4 checkboxes but are using columns-6, the 4 checkboxes will cut in half
          // due to this we limit the number of columns and then offset width when there is less than 6 checkboxes
          options.length === 1 && "columns-1",
          options.length >= 2 && "columns-2",
          options.length === 3 && "md:columns-3",
          options.length >= 4 && "md:columns-4",
          options.length >= 5 && "lg:columns-5",
          options.length >= 6 && "xl:columns-6",
          options.length === 1 && "md:w-1/4 lg:w-1/5 xl:w-1/6",
          options.length === 2 && "md:w-2/4 lg:w-2/5 xl:w-2/6",
          options.length === 3 && "md:w-3/4 lg:w-3/5 xl:w-3/6",
          options.length === 4 && "lg:w-4/5 xl:w-4/6",
          options.length === 5 && "xl:w-5/6",
        )}
      >
        {options.map(({ option }) => (
          <Checkbox
            label={option.label}
            key={option.value}
            name={`${label}-${option.value}`}
            className="my-0.5"
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
