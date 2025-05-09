import {
  RadioGroup as HeadlessUIRadioGroup,
  Label,
  Radio,
  RadioGroupOption,
} from "@headlessui/react";
import clsx from "clsx";
import { ElementType } from "react";

export type RadioGroupOption<ValueType> = {
  value: ValueType;
  label: string;
};

export interface RadioGroupProps<ValueType> {
  label?: string;
  options: RadioGroupOption<ValueType>[];
  selected: RadioGroupOption<ValueType>;
  as?: ElementType;
  className?: string;
  onChange: (o: RadioGroupOption<ValueType>) => void;
}

export function RadioGroup<ValueType extends string>({
  label,
  options,
  selected,
  as,
  className,
  onChange,
}: RadioGroupProps<ValueType>) {
  return (
    <HeadlessUIRadioGroup
      value={selected}
      onChange={onChange}
      as={as}
      className={clsx("flex flex-col text-xs", className)}
      data-testid={`radio-group-${label?.split(" ").join("-").toLowerCase()}`}
    >
      {label && (
        <Label className="mb-2 select-none font-semibold text-manatee-600">
          {label}
        </Label>
      )}
      <div className="grid grid-flow-col grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option}
            className="group/radio flex w-full flex-row items-center overflow-auto"
          >
            {({ checked }) => (
              <>
                <div
                  className={clsx(
                    "flex h-5 w-5 min-w-5 items-center justify-center overflow-x-auto rounded-full group-hover/radio:cursor-pointer",
                    "p-0.5 bg-manatee-200 ui-checked:bg-brand-primary",
                    "text-white focus:outline-none focus-visible:ring focus-visible:ring-brand-primary focus-visible:ring-opacity-75",
                    className,
                  )}
                >
                  {checked === true && (
                    <span className="bg-white rounded-full h-2 w-2" />
                  )}
                </div>

                <Label
                  as="span"
                  className={clsx(
                    "select-none overflow-hidden pl-1.5 font-medium text-manatee-500 group-hover/radio:cursor-pointer ui-checked:text-black",
                  )}
                >
                  {option.label || option.value}
                </Label>
              </>
            )}
          </Radio>
        ))}
      </div>
    </HeadlessUIRadioGroup>
  );
}
