import { Combobox, Transition } from "@headlessui/react";
import clsx from "clsx";
import React, {
  useState,
  useCallback,
  forwardRef,
  Ref,
  useRef,
  useMemo,
} from "react";
import { useVirtual } from "react-virtual";

import {
  getSelectOptionHeight,
  SelectLabel,
  SelectOption,
  SelectOptionComponent,
  SelectOptionsContainer,
  sortSelectOptions,
} from "src/components/inputs/select";
import { Pill } from "src/components/pill";

type MultiSelectOption = SelectOption<string>;

export interface MultiSelectProps {
  selected?: string[];
  options: MultiSelectOption[];
  label?: string;
  labelVariant?: "default" | "form";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rounded?: boolean;
  required?: boolean;
  onChange?: (values: string[]) => void;
}

const VirtualizedOptions = ({
  options,
  selected,
}: {
  options: MultiSelectOption[];
  selected?: string[];
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const variant = "primary";

  const rowVirtualizer = useVirtual({
    parentRef,
    size: options.length,
    estimateSize: useCallback(() => getSelectOptionHeight(variant), []),
    overscan: 5,
  });

  return (
    <SelectOptionsContainer ref={parentRef}>
      <div
        style={{
          height: `${rowVirtualizer.totalSize}px`,
        }}
        className="relative w-full"
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => (
          <SelectOptionComponent
            key={virtualRow.index}
            isSelected={selected?.includes(options?.[virtualRow.index].value)}
            variant={variant}
            option={options?.[virtualRow.index]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </SelectOptionsContainer>
  );
};

const MultiSelectComponent = (
  props: MultiSelectProps,
  ref: Ref<HTMLButtonElement | HTMLInputElement>,
) => {
  const {
    options: unsortedOptions,
    label,
    labelVariant = "default",
    placeholder,
    className,
    onChange,
    disabled,
    selected,
    rounded,
    required,
  } = props;

  const options = useMemo(
    () => unsortedOptions.sort(sortSelectOptions),
    [unsortedOptions],
  );

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
    (newSelected: MultiSelectOption[]) => {
      setQuery("");
      onChange?.(newSelected.map(({ value }) => value));
    },
    [onChange],
  );

  const paddingClassName = "py-2 pl-3 pr-2 sm:py-3 sm:pl-6";
  const selectClassName = clsx(
    "relative w-full cursor-default bg-manatee-50 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 disabled:text-manatee-500 text-sm flex",
    rounded && "rounded-full",
  );

  const selectedOptions = useMemo(
    () => options.filter(({ value }) => selected?.includes(value)),
    [options, selected],
  );

  const deselectOption = useCallback(
    (value: MultiSelectOption["value"]) => {
      onChangeWrapper(
        selectedOptions.filter((selected) => selected.value !== value),
      );
    },
    [onChangeWrapper, selectedOptions],
  );

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
        {label && (
          <SelectLabel
            label={label}
            labelVariant={labelVariant}
            labelPosition={"default"}
            isRequired={required}
          />
        )}
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
                "block w-full truncate border-none bg-manatee-50 pr-2 leading-5 text-gray-900 focus:outline-none focus:ring-0",
              )}
              displayValue={(option: MultiSelectOption) =>
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
          className="z-50 text-sm"
          leave="transition ease-in duration-50"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options>
            {filteredOptions.length === 0 ? (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="relative cursor-default select-none bg-white px-4 py-2 text-sm text-gray-900">
                  Nothing found.
                </div>
              </div>
            ) : options.length > 40 ? (
              <VirtualizedOptions
                options={filteredOptions ?? []}
                selected={selected}
              />
            ) : (
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
};

export const MultiSelect = forwardRef(MultiSelectComponent);
