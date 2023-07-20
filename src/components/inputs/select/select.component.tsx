import { useFloating, offset, flip, size } from "@floating-ui/react";
import { Combobox, Transition, Portal } from "@headlessui/react";
import clsx from "clsx";
import React, {
  useState,
  useCallback,
  useRef,
  CSSProperties,
  forwardRef,
  Ref,
  ReactNode,
} from "react";
import { GoTriangleDown } from "react-icons/go";
import { GrClose } from "react-icons/gr";
import { useVirtual } from "react-virtual";

import { Checkbox } from "src/components/inputs/checkbox";
import { formatObjectField, mergeRefs } from "src/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  variant: "primary" | "pill";
  name?: string;
  selected?: string;
  options: SelectOption[];
  label?: string;
  labelVariant?: "default" | "form";
  placeholder: string;
  className?: string;
  optionsClassName?: string;
  buttonClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowCustomValue?: boolean;
  withBasicSort?: boolean;
  onChange?: (value: string) => void;
  onValueClear?: () => void;
}

export const sortSelectOptions = (
  { label: labelA, value: valueA }: SelectOption,
  { label: labelB, value: valueB }: SelectOption,
): number => ((labelA || valueA) > (labelB || valueB) ? 1 : -1);

export const getSelectOptionHeight = (variant: SelectProps["variant"]) => {
  return variant === "pill" ? 30 : 40;
};

export const SelectLabel = ({
  label,
  labelVariant,
  htmlFor,
}: {
  label: SelectProps["label"];
  labelVariant: SelectProps["labelVariant"];
  htmlFor?: string;
}) => (
  <Combobox.Label
    htmlFor={htmlFor}
    className={clsx(
      labelVariant === "default" && "text-sm font-light md:text-base",
      labelVariant === "form" && "block text-sm font-bold",
    )}
  >
    {labelVariant === "form" ? formatObjectField(label) : label}
  </Combobox.Label>
);

export const SelectOptionComponent = ({
  variant,
  option,
  isSelected,
  style,
  className,
  withCheckbox,
}: {
  variant: SelectProps["variant"];
  option: SelectOption;
  isSelected?: boolean;
  style?: CSSProperties;
  className?: string;
  withCheckbox?: boolean;
}) => (
  <Combobox.Option
    key={option.value}
    className={({ active }) =>
      clsx(
        "relative flex cursor-default select-none items-center text-gray-900",
        variant === "pill" ? "px-2" : "px-4 pl-6",
        (active || isSelected) && "bg-ultramarine-50",
        className,
      )
    }
    value={option}
    style={{
      ...style,
      height: style?.height || getSelectOptionHeight(variant),
    }}
  >
    {withCheckbox && <Checkbox checked={isSelected} className="mr-2" />}
    <span
      className={clsx(
        "block truncate",
        isSelected ? "font-medium" : "font-normal",
      )}
    >
      {option.label}
    </span>
  </Combobox.Option>
);

export const SelectOptionsContainer = forwardRef(
  (
    { children, className }: { children: ReactNode; className?: string },
    ref: Ref<HTMLDivElement>,
  ) => (
    <div
      ref={ref}
      data-testid="select-options"
      className={clsx(
        "absolute z-[60] mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        className,
      )}
    >
      {children}
    </div>
  ),
);
SelectOptionsContainer.displayName = "SelectOptionsContainer";

export const Options = ({
  variant,
  options,
  currentSelected,
  className,
}: {
  variant: SelectProps["variant"];
  options: SelectOption[];
  currentSelected?: SelectOption;
  className?: string;
}) => (
  <SelectOptionsContainer className={className}>
    {options.map((option) => (
      <SelectOptionComponent
        key={option.value}
        isSelected={currentSelected?.value === option.value}
        variant={variant}
        option={option}
      />
    ))}
  </SelectOptionsContainer>
);

export const VirtualizedOptions = ({
  variant,
  options,
  currentSelected,
  className,
}: {
  variant: SelectProps["variant"];
  options: SelectOption[];
  currentSelected?: SelectOption;
  className?: string;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    parentRef,
    size: options.length,
    estimateSize: useCallback(() => getSelectOptionHeight(variant), [variant]),
    overscan: 5,
  });

  return (
    <SelectOptionsContainer ref={parentRef} className={className}>
      <div
        style={{
          height: `${rowVirtualizer.totalSize}px`,
        }}
        className="relative w-full"
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => (
          <SelectOptionComponent
            key={virtualRow.index}
            isSelected={
              currentSelected?.value === options?.[virtualRow.index].value
            }
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

export const Select = forwardRef(
  (props: SelectProps, ref: Ref<HTMLButtonElement | HTMLInputElement>) => {
    const {
      variant,
      name,
      options: unsortedOptions,
      label,
      labelVariant = "default",
      placeholder,
      className,
      optionsClassName,
      buttonClassName,
      onChange,
      disabled,
      selected,
      searchable = true,
      allowCustomValue,
      onValueClear,
      withBasicSort,
    } = props;

    const [query, setQuery] = useState("");

    const { refs, floatingStyles } = useFloating({
      placement: "bottom-start",
      middleware: [
        offset(5),
        flip({ padding: 10 }),
        size({
          apply({ rects, elements, availableHeight }) {
            Object.assign(elements.floating.style, {
              maxHeight: `${availableHeight}px`,
              minWidth: `${rects.reference.width}px`,
            });
          },
          padding: 10,
        }),
      ],
    });

    const options = withBasicSort
      ? unsortedOptions.sort(sortSelectOptions)
      : unsortedOptions;

    const filteredOptions =
      searchable && query !== ""
        ? options.filter((option) => {
            const lwrQuery = query.toLocaleLowerCase();
            const lwrValue = option.value.toLocaleLowerCase();
            const sanitisedLabel = option.label.toLocaleLowerCase();
            return (
              lwrValue.includes(lwrQuery) ||
              (sanitisedLabel && sanitisedLabel.includes(lwrQuery))
            );
          })
        : options;

    const onChangeWrapper = useCallback(
      (newSelected: SelectOption) => {
        onChange?.(newSelected.value);
      },
      [onChange],
    );

    const paddingClassName =
      variant === "pill" ? "h-5 pl-3 pr-2" : "py-2 pl-3 pr-2 sm:py-3 sm:pl-6";
    const selectButtonClassName = clsx(
      "relative w-full cursor-default bg-manatee-50 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 disabled:text-manatee-500",
      variant === "pill" ? "text-xs" : "text-sm",
      variant === "pill" && "rounded-full",
      buttonClassName || (variant !== "pill" && "rounded-sm"),
    );

    const selectedOption = selected
      ? options.find(({ value }) => value === selected) ||
        options.find(
          ({ value }) => value.toLowerCase() === selected.toLowerCase(),
        )
      : undefined;

    const showClearValueButton = onValueClear && selected;

    return (
      <Combobox
        disabled={disabled}
        onChange={onChangeWrapper}
        value={selectedOption || ""}
        name={name}
      >
        {({ open }) => (
          <div
            className={clsx(
              "relative flex flex-col items-start justify-center text-sm",
              className,
            )}
          >
            {label && (
              <SelectLabel
                htmlFor={name}
                label={label}
                labelVariant={labelVariant}
              />
            )}
            {searchable ? (
              <Combobox.Button
                data-testid="select"
                as="div"
                className={clsx(selectButtonClassName, label && "mt-2")}
                ref={refs.setReference}
              >
                <Combobox.Input
                  className={clsx(
                    "block w-full truncate rounded-[inherit] border-none bg-manatee-50 leading-5 text-gray-900 focus:ring-0",
                    paddingClassName,
                    showClearValueButton ? "pr-12" : "pr-8",
                  )}
                  displayValue={(option: SelectOption) =>
                    option.label || option.value
                  }
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder || "Select option"}
                  ref={ref as Ref<HTMLInputElement> | undefined}
                />
                <span className="absolute inset-y-0 right-0 flex items-center">
                  {showClearValueButton && (
                    <button
                      onClick={(e) => {
                        onValueClear();
                        e.stopPropagation();
                      }}
                      data-testid="select-clear-value"
                    >
                      <GrClose className="text-xs" />
                    </button>
                  )}
                  <button
                    className={clsx(
                      "h-full",
                      variant === "pill" ? "mx-2" : "ml-1 mr-4",
                    )}
                  >
                    <GoTriangleDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              </Combobox.Button>
            ) : (
              <Combobox.Button
                data-testid="select"
                className={clsx(
                  selectButtonClassName,
                  paddingClassName,
                  label && "mt-2",
                )}
                ref={mergeRefs([refs.setReference, ref])}
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
              as="div"
              className="z-[10000]"
              leave="transition ease-in duration-50"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery("")}
            >
              {open && (
                <Portal>
                  <Combobox.Options
                    static
                    ref={refs.setFloating}
                    style={floatingStyles}
                    className="z-50 text-sm"
                  >
                    {filteredOptions.length === 0 && query !== "" ? (
                      searchable && allowCustomValue ? (
                        <Options
                          variant={variant}
                          options={[{ value: query, label: `Use "${query}"` }]}
                          currentSelected={selectedOption}
                        />
                      ) : (
                        <div
                          className={clsx(
                            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                            optionsClassName,
                          )}
                        >
                          <div className="relative cursor-default select-none bg-white px-4 py-2 text-gray-900">
                            Nothing found.
                          </div>
                        </div>
                      )
                    ) : options.length > 40 ? (
                      <VirtualizedOptions
                        variant={variant}
                        options={filteredOptions ?? []}
                        currentSelected={selectedOption}
                        className={optionsClassName}
                      />
                    ) : (
                      <Options
                        variant={variant}
                        options={filteredOptions ?? []}
                        currentSelected={selectedOption}
                        className={optionsClassName}
                      />
                    )}
                  </Combobox.Options>
                </Portal>
              )}
            </Transition>
          </div>
        )}
      </Combobox>
    );
  },
);
Select.displayName = "Select";
