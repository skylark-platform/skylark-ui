import { Combobox, Transition } from "@headlessui/react";
import clsx from "clsx";
import React, { useState, useCallback, forwardRef, Ref } from "react";

import {
  SelectLabel,
  SelectOptionComponent,
  SelectOptionsContainer,
  sortSelectOptions,
} from "src/components/inputs/select";
import { Pill } from "src/components/pill";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  selected?: string[];
  options: SelectOption[];
  label?: string;
  labelVariant?: "default" | "form";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (values: string[]) => void;
}

export const MultiSelect = forwardRef(
  (props: SelectProps, ref: Ref<HTMLButtonElement | HTMLInputElement>) => {
    const {
      options: unsortedOptions,
      label,
      labelVariant = "default",
      placeholder,
      className,
      onChange,
      disabled,
      selected,
    } = props;

    const options = unsortedOptions.sort(sortSelectOptions);

    const [query, setQuery] = useState("");

    const filteredOptions =
      query === ""
        ? options
        : options.filter((option) => {
            const lwrQuery = query.toLocaleLowerCase();
            const lwrValue = option.value.toLocaleLowerCase();
            const sanitisedLabel = option.label.toLocaleLowerCase();
            return (
              lwrValue.includes(lwrQuery) ||
              (sanitisedLabel && sanitisedLabel.includes(lwrQuery))
            );
          });

    const onChangeWrapper = useCallback(
      (newSelected: SelectOption[]) => {
        setQuery("");
        onChange?.(newSelected.map(({ value }) => value));
      },
      [onChange],
    );

    const paddingClassName = "py-2 pl-3 pr-2 sm:py-3 sm:pl-6";
    const selectClassName = clsx(
      "relative w-full cursor-default bg-manatee-50 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 disabled:text-manatee-500 text-sm flex",
    );

    const selectedOptions = options.filter(({ value }) =>
      selected?.includes(value),
    );

    const deselectOption = (value: SelectOption["value"]) => {
      onChangeWrapper(
        selectedOptions.filter((selected) => selected.value !== value),
      );
    };

    return (
      <Combobox
        disabled={disabled}
        onChange={onChangeWrapper}
        value={selectedOptions}
        multiple
      >
        <div
          className={clsx(
            "relative flex flex-col items-start justify-center",
            className,
          )}
        >
          {label && <SelectLabel label={label} labelVariant={labelVariant} />}
          <div
            className={clsx(
              selectClassName,
              label && "mt-2",
              paddingClassName,
              "flex-wrap gap-2",
            )}
          >
            {selectedOptions.map(({ label, value }) => (
              <Pill
                key={value}
                label={label || value}
                className="my-auto bg-brand-primary"
                onDelete={() => deselectOption(value)}
              />
            ))}
            <Combobox.Button
              data-testid="multiselect-input"
              as="div"
              className="flex min-w-[6rem] flex-1"
            >
              <Combobox.Input
                className={clsx(
                  "block w-full truncate border-none bg-manatee-50 leading-5 text-gray-900 focus:outline-none focus:ring-0",
                )}
                displayValue={(option: SelectOption) =>
                  option.label || option.value
                }
                onChange={(event) => setQuery(event.target.value)}
                value={query}
                placeholder={placeholder}
                ref={ref as Ref<HTMLInputElement> | undefined}
              />
            </Combobox.Button>
          </div>
          <Transition
            as="div"
            className="z-50"
            leave="transition ease-in duration-50"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options>
              {filteredOptions.length === 0 ? (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="relative cursor-default select-none bg-white py-2 px-4 text-sm text-gray-900">
                    Nothing found.
                  </div>
                </div>
              ) : (
                // TODO Virtualise
                <SelectOptionsContainer>
                  {filteredOptions.map((option) => (
                    <SelectOptionComponent
                      key={option.value}
                      isSelected={selected?.includes(option.value)}
                      variant="primary"
                      option={option}
                      withCheckbox
                    />
                  ))}
                </SelectOptionsContainer>
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    );
  },
);
MultiSelect.displayName = "MultiSelect";
