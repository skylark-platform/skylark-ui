import { CheckedState } from "@radix-ui/react-checkbox";
import clsx from "clsx";

import { Checkbox } from "src/components/inputs/checkbox";

export type CheckboxOption = {
  label: string;
  value: string;
};

export type CheckboxOptionState = {
  option: CheckboxOption;
  state: CheckedState;
};

interface CheckboxGridProps {
  label?: string;
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

export const CheckboxGrid = ({
  label,
  className,
  withToggleAll,
  options,
  checkedOptions,
  onChange,
}: CheckboxGridProps) => {
  const allOptionsChecked = options.every((option) => option.state === true);

  const handleChange = (option: CheckboxOption, checkedState: CheckedState) => {
    const updatedCheckedOptions = checkedState
      ? [...checkedOptions, option.value]
      : checkedOptions.filter((value) => value !== option.value);
    onChange(updatedCheckedOptions);
  };

  const handleToggleAll = () => {
    onChange(
      allOptionsChecked ? [] : options.map(({ option: { value } }) => value),
    );
  };

  const handleToggleOnly = (onlyOption: CheckboxOption) => {
    onChange([onlyOption.value]);
  };

  return (
    <section
      className={clsx("flex flex-col text-xs", className)}
      data-testid={`checkbox-grid-${label?.split(" ").join("-").toLowerCase()}`}
    >
      <h4 className="mb-2 select-none font-semibold text-manatee-600">
        {label}
      </h4>
      {withToggleAll && (
        <Checkbox
          label="Toggle all"
          className="mb-2"
          onCheckedChange={handleToggleAll}
          name={`toggle-all-${label}`}
          checked={allOptionsChecked}
        />
      )}
      <div className="columns-2 space-y-2 md:columns-4 lg:columns-5 xl:columns-6">
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
    </section>
  );
};
