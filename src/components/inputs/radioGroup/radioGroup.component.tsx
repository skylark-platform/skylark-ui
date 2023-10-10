import { RadioGroup as HeadlessUIRadioGroup } from "@headlessui/react";
import clsx from "clsx";
import { ElementType } from "react";
import { FiCheck } from "react-icons/fi";

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
        <HeadlessUIRadioGroup.Label className="mb-2 select-none font-semibold text-manatee-600">
          {label}
        </HeadlessUIRadioGroup.Label>
      )}
      <div className="columns-2 space-y-2 md:columns-4 lg:columns-5 xl:columns-6">
        {options.map((option) => (
          <HeadlessUIRadioGroup.Option
            key={option.value}
            value={option}
            className="group/radio flex w-full flex-row items-center"
          >
            {({ checked }) => (
              <>
                <div
                  className={clsx(
                    "peer flex h-5 w-5 min-w-5 items-center justify-center rounded-full group-hover/radio:cursor-pointer",
                    "border-2 bg-manatee-200 ui-checked:border-brand-primary ui-checked:bg-brand-primary",
                    "text-white focus:outline-none focus-visible:ring focus-visible:ring-brand-primary focus-visible:ring-opacity-75",
                    className,
                  )}
                >
                  {checked === true && <FiCheck className="text-lg" />}
                </div>

                <HeadlessUIRadioGroup.Label
                  as="span"
                  className={clsx(
                    "select-none overflow-hidden pl-1.5 font-medium text-manatee-500 group-hover/radio:cursor-pointer ui-checked:text-black",
                  )}
                >
                  {option.label || option.value}
                </HeadlessUIRadioGroup.Label>
              </>
            )}
          </HeadlessUIRadioGroup.Option>
        ))}
      </div>
    </HeadlessUIRadioGroup>
  );
}
