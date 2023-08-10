import { useFloating, offset, flip, size } from "@floating-ui/react";
import { Popover } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useState } from "react";
import { GoTriangleDown } from "react-icons/go";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
import { InputLabel } from "src/components/inputs/label/label.component";
import { Select } from "src/components/inputs/select";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { ParsedSkylarkDimensionsWithValues } from "src/interfaces/skylark";
import { parseDateTimeForHTMLForm } from "src/lib/skylark/parsers";

export type AvailabilityDimensionsPickerValues = Record<string, string> | null;

export type TimeTravelPickerValues = string | null;

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
  dimensions: ParsedSkylarkDimensionsWithValues[];
  isLoadingDimensions: boolean;
  initialValues: AvailabilityPickerValues;
  close: () => void;
  save: (args: AvailabilityPickerValues) => void;
}) => {
  const [activeDimensions, setActiveDimensions] =
    useState<AvailabilityDimensionsPickerValues>(initialValues.dimensions);
  const [activeTimeTravel, setActiveTimeTravel] = useState(
    initialValues.timeTravel
      ? parseDateTimeForHTMLForm("datetime-local", initialValues.timeTravel)
      : "",
  );

  const onSave = () => {
    save({
      dimensions: activeDimensions,
      timeTravel: activeTimeTravel || null,
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
        <div className="">
          <PanelSectionTitle text={"Dimensions"} />
          <div
            className={clsx(
              "grid w-max gap-4",
              dimensions.length > 3 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {dimensions?.map(({ title, slug, values }) => (
              <div key={slug} className="w-72">
                <InputLabel text={title || slug} isRequired />
                <Select
                  variant="primary"
                  options={values.map((value) => ({
                    label: value.title || value.slug,
                    value: value.slug,
                  }))}
                  selected={activeDimensions?.[slug]}
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
              </div>
            ))}
          </div>
        </div>
        <div className="mb-6 w-72">
          <PanelSectionTitle text={"Time"} />
          <InputLabel
            text="Time Travel"
            htmlFor="availability-picker-time-travel-input"
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
            isLoadingDimensions ||
            !dimensions ||
            !activeDimensions ||
            Object.values(activeDimensions).length !==
              Object.values(dimensions).length
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

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [
      offset(5),
      flip({ padding: 40 }),
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

  return (
    <Popover className="relative">
      <Popover.Button ref={refs.setReference} as="div">
        <Button
          data-testid="open-availability-picker"
          variant="neutral"
          className={clsx(
            "relative w-full justify-start text-left font-normal md:w-52",
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
          {activeValues.dimensions && activeValues.timeTravel && (
            <>Dimensions & Time</>
          )}
          <div
            className={clsx(
              "absolute inset-y-0 right-4 ml-1 flex items-center text-black",
            )}
          >
            <GoTriangleDown className="h-3 w-3" aria-hidden="true" />
          </div>
        </Button>
        <div className="absolute inset-y-0 right-8 flex items-center">
          {activeValues.dimensions && (
            <button
              onClick={(e) => {
                save({ dimensions: null, timeTravel: null });
                e.stopPropagation();
              }}
            >
              <GrClose className="text-xs" />
            </button>
          )}
        </div>
      </Popover.Button>
      <Popover.Panel
        ref={refs.setFloating}
        style={floatingStyles}
        className="bg-manatee z-[50] flex max-h-96 flex-grow flex-col justify-between overflow-y-scroll rounded bg-white px-6 py-6 text-sm shadow-lg shadow-manatee-500 md:-left-20"
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
      </Popover.Panel>
    </Popover>
  );
};
