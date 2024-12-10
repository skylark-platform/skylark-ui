import {
  autoUpdate,
  flip,
  offset,
  size,
  useFloating,
} from "@floating-ui/react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import clsx from "clsx";
import React, {
  useState,
  useCallback,
  forwardRef,
  Ref,
  useRef,
  useMemo,
  Fragment,
  ReactNode,
  KeyboardEvent,
} from "react";
import { useVirtual } from "react-virtual";

import {
  getSelectOptionHeight,
  OptionsPortalWrapper,
  SelectLabel,
  SelectOption,
  SelectOptionComponent,
  SelectOptionsContainer,
  sortSelectOptions,
} from "src/components/inputs/select";
import { Pill } from "src/components/pill";

interface NothingFoundProps {
  nothingFoundText?: string;
  onNothingFoundClick?: () => void;
}

export type MultiSelectOption = SelectOption<string> & {
  config?: { colour?: string | null };
};

export interface MultiSelectProps extends NothingFoundProps {
  selected?: string[];
  selectedDivider?: ReactNode;
  options: MultiSelectOption[];
  label?: string;
  labelVariant?: "default" | "form";
  placeholder?: string;
  hidePlaceholderWhenSelected?: boolean;
  className?: string;
  disabled?: boolean;
  rounded?: boolean;
  required?: boolean;
  renderInPortal?: boolean;
  onChange?: (values: string[]) => void;
  onQueryChange?: (s: string) => void;
}

const NothingFound = ({
  nothingFoundText,
  onNothingFoundClick,
}: NothingFoundProps) => {
  const text = nothingFoundText || "Nothing found.";
  const className =
    "relative cursor-default select-none bg-white px-4 py-2 text-sm text-gray-900";

  return (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      {onNothingFoundClick ? (
        <button
          onClick={onNothingFoundClick}
          className={clsx(
            className,
            "cursor-pointer hover:text-brand-primary transition-colors",
          )}
        >
          {text}
        </button>
      ) : (
        <div className={clsx(className)}>{text}</div>
      )}
    </div>
  );
};

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
    hidePlaceholderWhenSelected,
    className,
    onChange,
    onQueryChange,
    disabled,
    selected,
    selectedDivider,
    rounded,
    required,
    nothingFoundText,
    renderInPortal,
    onNothingFoundClick,
  } = props;

  const options = useMemo(
    () => unsortedOptions.sort(sortSelectOptions),
    [unsortedOptions],
  );

  const [query, setStateQuery] = useState("");

  const setQuery = useCallback(
    (s: string) => {
      onQueryChange?.(s);
      setStateQuery(s);
    },
    [onQueryChange],
  );

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
    [onChange, setQuery],
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
    whileElementsMounted: autoUpdate,
  });

  const callNothingFoundOnEnter = onNothingFoundClick
    ? (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          onNothingFoundClick();
        }
      }
    : undefined;

  return (
    <Combobox
      disabled={disabled}
      onChange={onChangeWrapper}
      value={selectedOptions}
      multiple
    >
      {({ open }) => (
        <div
          className={clsx(
            "relative flex flex-col items-start justify-center overflow-x-hidden",
            className,
          )}
          ref={refs.setReference}
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
            {selectedOptions.map(
              ({ label, value, config, disabled, infoTooltip }, i, arr) => (
                <Fragment key={value}>
                  <Pill
                    label={label || value}
                    className={clsx(
                      "my-auto text-clip overflow-hidden",
                      "bg-brand-primary",
                      // TODO implement disabled colour = hidden because of segments
                      // disabled ? "bg-manatee-400" : "bg-brand-primary",
                    )}
                    onDelete={
                      disabled ? undefined : () => deselectOption(value)
                    }
                    bgColor={config?.colour}
                    infoTooltip={infoTooltip}
                  />
                  {selectedDivider && i < arr.length - 1 && selectedDivider}
                </Fragment>
              ),
            )}
            <ComboboxButton
              data-testid="multiselect-input"
              as="div"
              className="flex min-w-[6rem] flex-1"
            >
              <ComboboxInput
                className={clsx(
                  "block w-full truncate border-none bg-manatee-50 pr-2 leading-5 text-gray-900 focus:outline-none focus:ring-0",
                )}
                displayValue={(option: MultiSelectOption) =>
                  option.label || option.value
                }
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={callNothingFoundOnEnter}
                value={query}
                placeholder={
                  hidePlaceholderWhenSelected && selected && selected.length > 0
                    ? undefined
                    : placeholder
                }
                ref={ref as Ref<HTMLInputElement> | undefined}
              />
            </ComboboxButton>
          </div>
          <Transition
            as="div"
            className="z-50 text-sm"
            leave="transition ease-in duration-50"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            {open && (
              <OptionsPortalWrapper usePortal={!!renderInPortal}>
                <ComboboxOptions
                  static
                  ref={refs.setFloating}
                  style={floatingStyles}
                  className="z-50 text-xs sm:text-sm w-72 md:w-96"
                >
                  {filteredOptions.length === 0 ? (
                    <NothingFound
                      nothingFoundText={nothingFoundText}
                      onNothingFoundClick={onNothingFoundClick}
                    />
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
                </ComboboxOptions>
              </OptionsPortalWrapper>
            )}
          </Transition>
        </div>
      )}
    </Combobox>
  );
};

export const MultiSelect = forwardRef(MultiSelectComponent);
