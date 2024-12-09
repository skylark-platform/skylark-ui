import {
  useFloating,
  offset,
  flip,
  size,
  autoUpdate,
  Placement,
} from "@floating-ui/react";
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
  ReactElement,
} from "react";
import { FiCheck, FiChevronDown, FiInfo } from "react-icons/fi";
import { useVirtual } from "react-virtual";

import { FiX } from "src/components/icons";
import { Tooltip, TooltipSide } from "src/components/tooltip/tooltip.component";
import { formatObjectField, mergeRefs } from "src/lib/utils";

export interface SelectOption<T> {
  label: string;
  infoTooltip?: ReactNode;
  disabled?: boolean;
  value: T;
}

export interface SelectProps<T> {
  variant: "primary" | "pill";
  name?: string;
  selected?: T;
  options: SelectOption<T>[];
  label?: string;
  labelVariant?: "default" | "form" | "header" | "small";
  labelPosition?: "default" | "inline";
  placeholder: string | null;
  className?: string;
  optionsClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowCustomValue?: boolean;
  rounded?: boolean;
  withBasicSort?: boolean;
  renderInPortal?: boolean;
  displayRawSelectedValue?: boolean;
  selectedInfoTooltipPosition?: TooltipSide;
  floatingPosition?: Placement;
  onChange?: (value: T) => void;
  onValueClear?: () => void;
}

export const sortSelectOptions = <T extends string | number>(
  { label: labelA, value: valueA }: SelectOption<T>,
  { label: labelB, value: valueB }: SelectOption<T>,
): number => ((labelA || valueA) > (labelB || valueB) ? 1 : -1);

export const getSelectOptionHeight = <T extends string | number>(
  variant: SelectProps<T>["variant"],
) => {
  return variant === "pill" ? 30 : 40;
};

export const SelectLabel = <T extends string | number>({
  label,
  labelVariant,
  labelPosition,
  htmlFor,
  isRequired,
}: {
  label: SelectProps<T>["label"];
  labelVariant: SelectProps<T>["labelVariant"];
  labelPosition: SelectProps<T>["labelPosition"];
  htmlFor?: string;
  isRequired?: boolean;
}) => (
  <Combobox.Label
    htmlFor={htmlFor}
    className={clsx(
      labelPosition === "inline" && "whitespace-pre",
      labelVariant === "default" && "text-sm font-light md:text-base",
      labelVariant === "form" && "block text-sm font-bold",
      labelVariant === "header" && "text-sm md:text-base",
      labelVariant === "small" && "text-xs text-manatee-300",
    )}
  >
    {labelVariant === "form" ? formatObjectField(label) : label}
    {isRequired && <span className="pl-0.5 text-error">*</span>}
  </Combobox.Label>
);

const SelectOptionTooltip = ({
  tooltip,
  side,
}: {
  tooltip: ReactNode;
  side?: TooltipSide;
}) => (
  <Tooltip tooltip={tooltip} side={side}>
    <span className="block" data-testid="select-tooltip-trigger">
      <FiInfo className="text-sm" />
    </span>
  </Tooltip>
);

export const SelectOptionComponent = <T extends string | number>({
  variant,
  option,
  isSelected,
  style,
  className,
  withCheckbox,
}: {
  variant: SelectProps<T>["variant"];
  option: SelectOption<T>;
  isSelected?: boolean;
  style?: CSSProperties;
  className?: string;
  withCheckbox?: boolean;
}) => (
  <Combobox.Option
    key={option.value}
    className={({ active }) =>
      clsx(
        "relative flex cursor-default select-none items-center",
        variant === "pill" ? "px-2" : "px-4 pl-6",
        (active || isSelected) && !option.disabled && "bg-ultramarine-50",
        option.disabled ? "bg-manatee-100 text-gray-400" : "text-gray-900",
        className,
      )
    }
    value={option}
    style={{
      ...style,
      height: style?.height || getSelectOptionHeight(variant),
    }}
    disabled={option.disabled}
  >
    {withCheckbox && (
      <span
        className={clsx(
          "flex h-5 w-5 min-w-5 items-center justify-center rounded-sm border-2 mr-2",
          !isSelected &&
            (option.disabled
              ? "text-manatee-600 bg-manatee-400 border-manatee-400"
              : "text-white bg-manatee-200 border-manatee-200"),
          isSelected &&
            (option.disabled
              ? "text-manatee-100 bg-manatee-400 border-manatee-400"
              : "border-brand-primary bg-brand-primary text-white"),
        )}
      >
        {isSelected && <FiCheck className="text-lg" />}
      </span>
    )}
    <span
      className={clsx(
        "block truncate flex-grow",
        isSelected ? "font-medium" : "font-normal",
      )}
    >
      {option.label}
    </span>
    {option.infoTooltip && (
      <SelectOptionTooltip tooltip={option.infoTooltip} side={"right"} />
    )}
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
        "absolute z-[60] mt-1 max-h-48 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        className,
        !className?.includes(" w-") && !className?.startsWith("w-") && "w-full",
      )}
    >
      {children}
    </div>
  ),
);
SelectOptionsContainer.displayName = "SelectOptionsContainer";

export const Options = <T extends string | number>({
  variant,
  options,
  currentSelected,
  className,
}: {
  variant: SelectProps<T>["variant"];
  options: SelectOption<T>[];
  currentSelected?: SelectOption<T>;
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

export const VirtualizedOptions = <T extends string | number>({
  variant,
  options,
  currentSelected,
  className,
}: {
  variant: SelectProps<T>["variant"];
  options: SelectOption<T>[];
  currentSelected?: SelectOption<T>;
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

export const OptionsPortalWrapper = ({
  usePortal,
  children,
}: {
  usePortal: boolean;
  children: ReactNode;
}): JSX.Element => {
  if (usePortal) {
    return <Portal>{children}</Portal>;
  }

  return <>{children}</>;
};

const SelectComponent = <T extends string | number>(
  props: SelectProps<T>,
  propRef: Ref<HTMLInputElement | HTMLButtonElement>,
) => {
  const {
    variant,
    name,
    options: unsortedOptions,
    label,
    labelVariant = "default",
    labelPosition = "default",
    placeholder,
    className,
    optionsClassName,
    onChange,
    disabled,
    selected,
    selectedInfoTooltipPosition,
    searchable = true,
    rounded,
    allowCustomValue,
    onValueClear,
    withBasicSort,
    renderInPortal,
    displayRawSelectedValue,
    floatingPosition,
  } = props;

  const [query, setQuery] = useState("");

  const { refs, floatingStyles } = useFloating({
    placement: floatingPosition || "bottom-start",
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
    whileElementsMounted: autoUpdate,
  });

  const options = withBasicSort
    ? unsortedOptions.sort(sortSelectOptions)
    : unsortedOptions;

  const filteredOptions =
    searchable && query !== ""
      ? options.filter((option) => {
          const lwrQuery = query.toLocaleLowerCase();
          const lwrValue = `${option.value}`.toLocaleLowerCase();
          const sanitisedLabel = option.label.toLocaleLowerCase();
          return (
            lwrValue.includes(lwrQuery) ||
            (sanitisedLabel && sanitisedLabel.includes(lwrQuery))
          );
        })
      : options;

  const onChangeWrapper = useCallback(
    (newSelected: SelectOption<T>) => {
      onChange?.(newSelected.value);
    },
    [onChange],
  );

  const sizingClassName =
    variant === "pill"
      ? "h-5 pl-3 pr-2"
      : clsx("h-8 pl-3 pr-2 sm:h-10", rounded ? "sm:pl-6" : "sm:pl-4");
  const roundedClassName =
    rounded || variant === "pill" ? "rounded-full" : "rounded-sm";
  const selectClassName = clsx(
    "relative w-full cursor-default bg-manatee-50 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 disabled:text-manatee-500",
    variant === "pill" ? "text-xs" : "text-xs sm:text-sm",
    roundedClassName,
  );

  const selectedOption = selected
    ? options.find(({ value }) => value === selected)
    : undefined;

  const showClearValueButton = onValueClear && selected;

  return (
    <Combobox
      disabled={disabled || !options}
      onChange={onChangeWrapper}
      value={
        (displayRawSelectedValue && selected
          ? { label: selected, value: selected }
          : selectedOption) || ""
      }
      name={name}
    >
      {({ open }) => (
        <div
          className={clsx(
            "relative flex text-xs sm:text-sm",
            label && labelPosition === "inline"
              ? "flex-row items-center justify-center"
              : "flex-col items-start justify-center",
            className,
          )}
        >
          {label && (
            <SelectLabel
              htmlFor={name}
              label={label}
              labelVariant={labelVariant}
              labelPosition={labelPosition}
            />
          )}
          {searchable ? (
            <Combobox.Button
              data-testid="select"
              as="div"
              className={clsx(
                selectClassName,
                label && labelPosition === "default" && "mt-2",
                label &&
                  labelPosition === "inline" &&
                  (labelVariant === "small" ? "ml-1" : "ml-2"),
              )}
              ref={refs.setReference}
            >
              <Combobox.Input
                className={clsx(
                  "block w-full truncate border-none bg-manatee-50 leading-5 text-gray-900 focus:ring-0 disabled:text-manatee-500",
                  sizingClassName,
                  roundedClassName,
                  showClearValueButton ? "pr-12" : "pr-8",
                )}
                displayValue={(option: SelectOption<T>) =>
                  `${option.label || option.value || ""}`
                }
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  placeholder === null
                    ? undefined
                    : placeholder || "Select option"
                }
                ref={propRef as Ref<HTMLInputElement> | undefined}
                data-value={selected}
              />
              <span className="absolute inset-y-0 right-0 flex items-center">
                {selectedOption?.infoTooltip && (
                  <SelectOptionTooltip
                    tooltip={selectedOption.infoTooltip}
                    side={selectedInfoTooltipPosition || "top"}
                  />
                )}
                {showClearValueButton && (
                  <button
                    onClick={(e) => {
                      onValueClear();
                      e.stopPropagation();
                    }}
                    data-testid="select-clear-value"
                  >
                    <FiX
                      className={clsx("text-xs", disabled && "opacity-25")}
                    />
                  </button>
                )}
                <button
                  className={clsx(
                    "h-full",
                    variant === "pill" ? "mx-2" : "ml-0.5 mr-3.5",
                  )}
                >
                  <FiChevronDown
                    className={clsx("text-xl", disabled && "opacity-25")}
                    aria-hidden="true"
                  />
                </button>
              </span>
            </Combobox.Button>
          ) : (
            <Combobox.Button
              data-testid="select"
              className={clsx(
                selectClassName,
                roundedClassName,
                sizingClassName,
                label && labelPosition === "default" && "mt-2",
                label &&
                  labelPosition === "inline" &&
                  (labelVariant === "small" ? "ml-1" : "ml-2"),
              )}
              ref={mergeRefs([refs.setReference, propRef])}
            >
              <span
                className={clsx(
                  "block truncate",
                  !selectedOption?.label && "text-gray-300",
                  variant === "pill" && "pr-6",
                )}
              >
                {selectedOption?.label || placeholder || "Select option"}
              </span>
              <span
                className={clsx(
                  "pointer-events-none absolute inset-y-0 right-0 flex items-center",
                  variant === "pill" ? "pr-2" : "pr-3.5",
                )}
              >
                <FiChevronDown className="text-xl" aria-hidden="true" />
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
              <OptionsPortalWrapper usePortal={!!renderInPortal}>
                <Combobox.Options
                  static
                  ref={refs.setFloating}
                  style={floatingStyles}
                  className="z-50 text-xs sm:text-sm"
                >
                  {filteredOptions.length === 0 && query !== "" ? (
                    searchable && allowCustomValue ? (
                      <Options
                        variant={variant}
                        options={[
                          {
                            value: query as T,
                            label: `Use "${query}"`,
                          },
                        ]}
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
                  ) : options.length > 60 ? (
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
              </OptionsPortalWrapper>
            )}
          </Transition>
        </div>
      )}
    </Combobox>
  );
};

// Wrapper to make forwardRef work with generic
export const Select = forwardRef(SelectComponent) as <
  T extends string | number,
>(
  props: SelectProps<T> & {
    ref?: Ref<HTMLButtonElement | HTMLInputElement>;
  },
) => ReactElement;
