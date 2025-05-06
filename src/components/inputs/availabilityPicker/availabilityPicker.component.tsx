import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import { Button } from "src/components/button";
import { FiX } from "src/components/icons";
import { InputLabel } from "src/components/inputs/label/label.component";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { UTC_NAME, Select, TimezoneSelect } from "src/components/inputs/select";
import { PanelSectionTitle } from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { ParsedSkylarkDimensionWithValues } from "src/interfaces/skylark";
import { parseDateTimeForHTMLForm } from "src/lib/skylark/parsers";

export type AvailabilityDimensionsPickerValues = Record<
  string,
  string
  // string | string[]
> | null;

export type TimeTravelPickerValues = {
  datetime: string;
  timezone: string;
} | null;

export type AvailabilityPickerValues = {
  dimensions: AvailabilityDimensionsPickerValues;
  timeTravel: TimeTravelPickerValues;
};

interface AvailabilityPickerProps {
  activeValues: AvailabilityPickerValues;
  setActiveAvailability: (args: AvailabilityPickerValues) => void;
}

const AvailabilitySelectors = ({
  dimensions,
  isLoadingDimensions,
  initialValues,
  close,
  save,
}: {
  dimensions: ParsedSkylarkDimensionWithValues[];
  isLoadingDimensions: boolean;
  initialValues: AvailabilityPickerValues;
  close: () => void;
  save: (args: AvailabilityPickerValues) => void;
}) => {
  const [activeDimensions, setActiveDimensions] =
    useState<AvailabilityDimensionsPickerValues>(initialValues.dimensions);
  const [activeTimeTravel, setActiveTimeTravel] = useState(
    initialValues.timeTravel
      ? parseDateTimeForHTMLForm(
          "datetime-local",
          initialValues.timeTravel.datetime,
        )
      : "",
  );
  const [activeTimeTravelOffset, setActiveTimeTravelOffset] = useState(
    initialValues.timeTravel ? initialValues.timeTravel.timezone : UTC_NAME,
  );

  const hasDimensions = dimensions.length > 0;

  const onSave = () => {
    save({
      dimensions: activeDimensions,
      timeTravel: activeTimeTravel
        ? {
            datetime: activeTimeTravel,
            timezone: activeTimeTravelOffset,
          }
        : null,
    });
    close();
  };

  const onClear = () => {
    save({
      dimensions: null,
      timeTravel: null,
    });
    close();
  };

  return (
    <>
      <div className="flex h-full w-full flex-grow flex-col gap-4 md:flex-row">
        {(isLoadingDimensions || hasDimensions) && (
          <div className="">
            <PanelSectionTitle text={"Audience"} />
            <div
              className={clsx(
                "grid w-max gap-4",
                dimensions.length > 3 ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {dimensions?.map(({ title, slug, values }) => {
                // const selectedValues = activeDimensions?.[slug]
                //   ? typeof activeDimensions?.[slug] === "string"
                //     ? [activeDimensions?.[slug]]
                //     : activeDimensions?.[slug]
                //   : [];
                return (
                  <div key={slug} className="w-72">
                    <InputLabel formatText text={title || slug} isRequired />
                    <Select
                      variant="primary"
                      options={values.map((value) => ({
                        label: value.title || value.slug,
                        value: value.slug,
                      }))}
                      selected={activeDimensions?.[slug] || ""}
                      onChange={(updatedValue) =>
                        setActiveDimensions({
                          ...activeDimensions,
                          [slug]: updatedValue,
                        })
                      }
                      disabled={isLoadingDimensions}
                      placeholder={`Select ${title || slug || "Dimension"} value`}
                      className="mt-1"
                      renderInPortal
                    />
                    {/* TODO finish Multiselect */}
                    {/* <MultiSelect
                      options={values.map((value) => ({
                        label: value.title || value.slug,
                        value: value.slug,
                      }))}
                      selected={selectedValues}
                      onChange={(updatedValues) =>
                        setActiveDimensions({
                          ...activeDimensions,
                          [slug]: updatedValues,
                        })
                      }
                      disabled={isLoadingDimensions}
                      placeholder={`Select ${title || slug || "Dimension"} value`}
                      hidePlaceholderWhenSelected
                      className="mt-1"
                      renderInPortal
                    /> */}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mb-6 w-72">
          <PanelSectionTitle text={"Time Window"} />
          <div className="flex flex-col gap-4">
            <div>
              <InputLabel
                text="Time travel"
                htmlFor="availability-picker-time-travel-input"
                isRequired={!hasDimensions}
              />
              <input
                onChange={(e) => setActiveTimeTravel(e.target.value)}
                id="availability-picker-time-travel-input"
                value={activeTimeTravel || ""}
                type="datetime-local"
                step="1"
                className={clsx(
                  "h-8 w-full rounded bg-manatee-50 px-4 md:h-10",
                  activeTimeTravel ? "text-black" : "text-manatee-400",
                )}
              />
            </div>
            <TimezoneSelect
              label="Timezone"
              labelVariant="form"
              disabled={!activeTimeTravel}
              selected={activeTimeTravelOffset}
              variant="primary"
              placeholder="Select Timezone"
              renderInPortal
              onChange={(t) => setActiveTimeTravelOffset(t || UTC_NAME)}
              onValueClear={
                activeTimeTravelOffset !== UTC_NAME
                  ? () => setActiveTimeTravelOffset(UTC_NAME)
                  : undefined
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          className="mx-2 -mt-2 rounded-full px-2"
          type="button"
          danger
          onClick={onClear}
        >
          Clear
        </Button>
        <Button
          variant="primary"
          className="-mt-2"
          type="submit"
          disabled={
            hasDimensions
              ? isLoadingDimensions ||
                !dimensions ||
                !activeDimensions ||
                Object.values(activeDimensions).length !==
                  Object.values(dimensions).length
              : !activeTimeTravel
          }
          onClick={onSave}
          success
        >
          Save
        </Button>
      </div>
    </>
  );
};

export const AvailabilityPicker = ({
  activeValues,
  setActiveAvailability: save,
}: AvailabilityPickerProps) => {
  const { dimensions, isLoading: isLoadingDimensions } =
    useAvailabilityDimensionsWithValues();

  return (
    <Popover>
      <div className="group/availability-picker-button relative w-full md:w-52">
        <PopoverButton
          as={Button}
          data-testid="open-availability-picker"
          variant="neutral"
          className={clsx(
            "w-full justify-start text-left font-normal group-hover/availability-picker-button:bg-manatee-100",
            !activeValues.dimensions &&
              !activeValues.timeTravel &&
              "text-manatee-400",
          )}
          animated={false}
        >
          {!activeValues.dimensions && !activeValues.timeTravel && (
            <>Availability Filters</>
          )}
          {activeValues.dimensions && !activeValues.timeTravel && (
            <>Dimensions only</>
          )}
          {!activeValues.dimensions && activeValues.timeTravel && (
            <>Time travel only</>
          )}
          {activeValues.dimensions && activeValues.timeTravel && (
            <>Dimensions & Time</>
          )}
          <div
            className={clsx(
              "absolute inset-y-0 right-3.5 ml-1 flex items-center text-black",
            )}
          >
            <FiChevronDown className="text-xl" aria-hidden="true" />
          </div>
        </PopoverButton>
        {(activeValues.dimensions || activeValues.timeTravel) && (
          <button
            className="absolute inset-y-0 right-8 z-[1] flex items-center px-0.5"
            onClick={(e) => {
              save({
                dimensions: null,
                timeTravel: null,
              });
              e.stopPropagation();
            }}
            aria-label="clear availability"
          >
            <FiX className="mr-0.5 text-xs" />
          </button>
        )}
      </div>
      <PopoverPanel
        data-testid="availability-picker"
        anchor="bottom start"
        className="[--anchor-gap:8px] [--anchor-padding:8px] bg-manatee z-[50] flex max-h-96 flex-grow flex-col justify-between overflow-y-scroll rounded bg-white px-6 py-6 text-sm shadow-lg shadow-manatee-500 md:-left-20"
      >
        {({ close }) => (
          <>
            <AvailabilitySelectors
              dimensions={dimensions || []}
              isLoadingDimensions={isLoadingDimensions}
              initialValues={activeValues}
              save={save}
              close={close}
            />
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
};
