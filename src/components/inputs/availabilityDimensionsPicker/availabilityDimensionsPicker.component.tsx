import { Popover } from "@headlessui/react";
import { useState } from "react";
import { GrDown } from "react-icons/gr";

import { Button } from "src/components/button";
import { Select } from "src/components/inputs/select";
import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { ParsedSkylarkDimensionsWithValues } from "src/interfaces/skylark";

export type AvailabilityDimensionsPickerValues = Record<string, string> | null;

interface AvailabilityDimensionsPickerProps {
  activeDimensions: AvailabilityDimensionsPickerValues;
  setActiveDimensions: (args: AvailabilityDimensionsPickerValues) => void;
}

const AvailabilityDimensionSelectors = ({
  dimensions,
  isLoadingDimensions,
  initialActiveDimensions,
  close,
  save,
}: {
  dimensions: ParsedSkylarkDimensionsWithValues[];
  isLoadingDimensions: boolean;
  initialActiveDimensions: AvailabilityDimensionsPickerValues;
  close: () => void;
  save: (args: AvailabilityDimensionsPickerValues) => void;
}) => {
  const [activeDimensions, setActiveDimensions] =
    useState<AvailabilityDimensionsPickerValues>(initialActiveDimensions);

  const onSave = () => {
    save(activeDimensions);
    close();
  };

  const onClear = () => {
    save(null);
    close();
  };

  return (
    <>
      <div className="flex h-full flex-grow flex-col">
        {dimensions?.map(({ title, slug, values }) => (
          <div key={slug} className="mb-6">
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
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          className="mx-2 mt-4 rounded-full px-2"
          type="button"
          danger
          onClick={onClear}
        >
          Clear
        </Button>
        <Button
          variant="primary"
          className="mt-4"
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

export const AvailabilityDimensionsPicker = ({
  activeDimensions: initialActiveDimensions,
  setActiveDimensions: save,
}: AvailabilityDimensionsPickerProps) => {
  const { dimensions, isLoading: isLoadingDimensions } =
    useAvailabilityDimensionsWithValues();

  return (
    <Popover className="relative">
      <Popover.Button as="div">
        <Button variant="ghost" className="mx-4">
          Dimensions <GrDown className="ml-1 h-4 w-4" />
        </Button>
      </Popover.Button>
      <Popover.Panel className="bg-manatee absolute -left-6 z-[50] flex max-h-96 w-96 flex-col justify-between overflow-y-scroll rounded bg-white px-6 py-6 text-sm shadow-lg shadow-manatee-500">
        {({ close }) => (
          <AvailabilityDimensionSelectors
            dimensions={dimensions || []}
            isLoadingDimensions={isLoadingDimensions}
            initialActiveDimensions={initialActiveDimensions}
            save={save}
            close={close}
          />
        )}
      </Popover.Panel>
    </Popover>
  );
};
