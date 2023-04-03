import { Combobox, Transition } from "@headlessui/react";
import clsx from "clsx";
import { useState, Fragment, useCallback, useRef, CSSProperties } from "react";
import { GoTriangleDown } from "react-icons/go";
import { GrClose } from "react-icons/gr";
import { useVirtual } from "react-virtual";

import { formatObjectField } from "src/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  variant: "primary" | "pill";
  selected: string;
  options: SelectOption[];
  label?: string;
  labelVariant?: "default" | "form";
  placeholder: string;
  className?: string;
  disabled?: boolean;
  withSearch?: boolean;
  allowCustomValue?: boolean;
  rounded?: boolean;
  onChange?: (value: string) => void;
  onValueClear?: () => void;
}

export const Option = ({
  variant,
  option,
  currentSelected,
  style,
}: {
  variant: SelectProps["variant"];
  option: SelectOption;
  currentSelected?: SelectOption;
  style?: CSSProperties;
}) => (
  <Combobox.Option
    key={option.value}
    className={({ active }) =>
      clsx(
        "relative flex cursor-default select-none items-center text-gray-900",
        variant === "pill" ? "px-2" : "px-4 pl-6",
        (active || currentSelected?.value === option.value) &&
          "bg-ultramarine-50",
      )
    }
    value={option}
    style={style}
  >
    <span
      className={clsx(
        "block truncate",
        currentSelected?.value === option.value ? "font-medium" : "font-normal",
      )}
    >
      {option.label}
    </span>
  </Combobox.Option>
);

const VirtualizedOptions = ({
  variant,
  options,
  currentSelected,
}: {
  variant: SelectProps["variant"];
  options: SelectOption[];
  currentSelected?: SelectOption;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    parentRef,
    size: options.length,
    estimateSize: useCallback(() => (variant === "pill" ? 30 : 40), [variant]),
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      data-testid="select-options"
      className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
    >
      <div
        style={{
          height: `${rowVirtualizer.totalSize}px`,
        }}
        className="relative w-full"
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => (
          <Option
            key={virtualRow.index}
            currentSelected={currentSelected}
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
    </div>
  );
};

export const Select = ({
  variant,
  options,
  label,
  labelVariant = "default",
  placeholder,
  className,
  onChange,
  disabled,
  selected,
  withSearch,
  rounded,
  allowCustomValue,
  onValueClear,
}: SelectProps) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return option.value.toLowerCase().includes(query.toLowerCase());
        });

  const onChangeWrapper = useCallback(
    (newSelected: SelectOption) => {
      onChange?.(newSelected.value);
    },
    [onChange],
  );

  const paddingClassName =
    variant === "pill" ? "h-5 pl-3 pr-2" : "py-2 pl-3 pr-2 sm:py-3 sm:pl-6";
  const roundedClassName =
    rounded || variant === "pill" ? "rounded-full" : "rounded-sm";
  const selectClassName = clsx(
    "relative w-full cursor-default bg-manatee-50 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 disabled:text-manatee-500",
    variant === "pill" ? "text-xs" : "text-sm",
    roundedClassName,
  );

  const selectedOption = options.find(({ value }) => value === selected);

  const showClearValueButton = onValueClear && selected;

  return (
    <Combobox
      disabled={disabled}
      onChange={onChangeWrapper}
      value={selectedOption || ""}
    >
      <div
        className={clsx(
          "relative flex flex-col items-start justify-center",
          className,
        )}
      >
        {label && (
          <Combobox.Label
            className={clsx(
              labelVariant === "default" && "text-sm font-light md:text-base",
              labelVariant === "form" && "block text-sm font-bold",
            )}
          >
            {labelVariant === "form" ? formatObjectField(label) : label}
          </Combobox.Label>
        )}
        {withSearch ? (
          <div className={clsx(selectClassName, label && "mt-2")}>
            <Combobox.Input
              className={clsx(
                "block w-full truncate border-none bg-manatee-50 leading-5 text-gray-900 focus:ring-0",
                paddingClassName,
                roundedClassName,
                showClearValueButton ? "pr-12" : "pr-8",
              )}
              displayValue={(option: SelectOption) => option.value}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder || "Select option"}
            />
            <span className="absolute inset-y-0 right-0 flex items-center">
              {showClearValueButton && (
                <button onClick={onValueClear} data-testid="select-clear-value">
                  <GrClose className="text-xs" />
                </button>
              )}
              <Combobox.Button
                data-cy="select"
                className={clsx(variant === "pill" ? "px-2" : "pl-1 pr-4")}
              >
                <GoTriangleDown className="h-3 w-3" aria-hidden="true" />
              </Combobox.Button>
            </span>
          </div>
        ) : (
          <Combobox.Button
            data-cy="select"
            className={clsx(selectClassName, paddingClassName, label && "mt-2")}
          >
            <span
              className={clsx(
                "block truncate",
                !selectedOption?.label && "text-gray-300",
              )}
            >
              {selectedOption?.label || placeholder || "Select option"}
            </span>
            <span
              className={clsx(
                "pointer-events-none absolute inset-y-0 right-0 flex items-center",
                variant === "pill" ? "pr-2" : "pr-4",
              )}
            >
              <GoTriangleDown className="h-3 w-3" aria-hidden="true" />
            </span>
          </Combobox.Button>
        )}

        <Transition
          as={Fragment}
          leave="transition ease-in duration-50"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options>
            {filteredOptions.length === 0 && query !== "" ? (
              withSearch && allowCustomValue ? (
                <VirtualizedOptions
                  variant={variant}
                  options={[{ value: query, label: `Use "${query}"` }]}
                  currentSelected={selectedOption}
                />
              ) : (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="relative cursor-default select-none bg-white py-2 px-4 text-sm text-gray-900">
                    Nothing found.
                  </div>
                </div>
              )
            ) : (
              <VirtualizedOptions
                variant={variant}
                options={filteredOptions ?? []}
                currentSelected={selectedOption}
              />
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
};
