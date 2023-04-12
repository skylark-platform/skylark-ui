import { CheckedState } from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { useEffect, useState } from "react";

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
  className?: string;
  withToggleAll?: boolean;
  onChange: (optionsState: CheckboxOptionState[]) => void;
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
  options,
  className,
  withToggleAll,
  onChange,
}: CheckboxGridProps) => {
  const [checkboxState, setCheckboxState] = useState(options);

  const allOptionsChecked = checkboxState.every(
    (option) => option.state === true,
  );

  const handleChange = (option: CheckboxOption, checkedState: CheckedState) => {
    const newCheckedOptions = checkboxState.map((state) =>
      option.value === state.option.value
        ? { option, state: checkedState }
        : state,
    );
    setCheckboxState(newCheckedOptions);
    onChange(newCheckedOptions);
  };

  const handleToggleAll = () => {
    const newCheckedOptions = checkboxState.map(({ option }) => ({
      option,
      state: !allOptionsChecked,
    }));
    setCheckboxState(newCheckedOptions);
    onChange(newCheckedOptions);
  };

  useEffect(() => {
    setCheckboxState(options);
  }, [options]);

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
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
        {checkboxState.map(({ option, state }) => (
          <Checkbox
            label={option.label}
            key={option.value}
            name={`${label}-${option.value}`}
            checked={state}
            onCheckedChange={(checkedState) =>
              handleChange(option, checkedState)
            }
          />
        ))}
      </div>
    </section>
  );
};
