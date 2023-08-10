import { useFloating, offset, flip, size } from "@floating-ui/react";
import { Popover } from "@headlessui/react";
import clsx from "clsx";
import { useState } from "react";
import { GoTriangleDown } from "react-icons/go";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
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
          <p className="-mt-4 mb-3 text-xs text-manatee-300">Required</p>
          <div
            className={clsx(
              "grid w-max gap-4",
              dimensions.length > 3 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {dimensions?.map(({ title, slug, values }) => (
              <div key={slug} className="w-72">
                <PanelFieldTitle text={title || slug} />
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
          <p className="-mt-4 mb-3 text-xs text-manatee-300">Optional</p>
          <PanelFieldTitle text="Time Travel" />
          <input
            onChange={(e) => setActiveTimeTravel(e.target.value)}
            value={activeTimeTravel || ""}
            type="datetime-local"
            step="1"
            className="h-8 w-full rounded bg-manatee-50 px-4 md:h-10"
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
      <Popover.Button
        ref={refs.setReference}
        className={clsx(
          "relative flex h-8 w-full items-center justify-start rounded-full px-3 text-sm md:h-10 md:w-52 md:px-6",
          activeValues.dimensions
            ? "bg-success bg-opacity-20 text-success"
            : "bg-manatee-50 text-manatee-400",
        )}
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

        <span className="absolute inset-y-0 right-3 flex items-center">
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
          <button className={clsx("ml-1 h-full")}>
            <GoTriangleDown className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
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
