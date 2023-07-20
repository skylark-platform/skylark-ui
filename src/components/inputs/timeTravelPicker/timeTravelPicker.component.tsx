import { Popover } from "@headlessui/react";
import clsx from "clsx";
import { useState } from "react";
import { GrDown } from "react-icons/gr";

import { Button } from "src/components/button";
import { Select } from "src/components/inputs/select";
import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { ParsedSkylarkDimensionsWithValues } from "src/interfaces/skylark";
import {
  parseDateTimeForHTMLForm,
  parseInputFieldValue,
  parseMetadataForHTMLForm,
} from "src/lib/skylark/parsers";

export type TimeTravelPickerValues = string | null;

interface TimeTravelPickerProps {
  activeTimeTravel: TimeTravelPickerValues;
  setActiveDimensions: (args: TimeTravelPickerValues) => void;
}

export const TimeTravelSelectors = ({
  initialActiveTimeTravel,
  close,
  save,
}: {
  initialActiveTimeTravel: TimeTravelPickerValues;
  close: () => void;
  save: (args: TimeTravelPickerValues) => void;
}) => {
  const [activeTimeTravel, setActiveTimeTravel] = useState(
    initialActiveTimeTravel
      ? parseDateTimeForHTMLForm("datetime-local", initialActiveTimeTravel)
      : "",
  );

  const onSave = () => {
    save(
      activeTimeTravel
        ? (parseInputFieldValue(activeTimeTravel, "datetime") as string)
        : null,
    );
    close();
  };

  const onClear = () => {
    save(null);
    close();
  };

  console.log(activeTimeTravel);

  return (
    <>
      <div className="flex h-full flex-grow flex-col">
        <div className="">
          <PanelFieldTitle text={"Time Travel"} />
          <input
            // aria-invalid={error ? "true" : "false"}
            onChange={(e) => setActiveTimeTravel(e.target.value)}
            value={activeTimeTravel || ""}
            type="datetime-local"
            step="1"
            className="w-full rounded-sm bg-manatee-50 px-4 py-3"
          />
        </div>
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
            !activeTimeTravel || Object.values(activeTimeTravel).length < 1
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

export const TimeTravelPicker = ({
  activeTimeTravel: initialActiveTimeTravel,
  setActiveDimensions,
}: TimeTravelPickerProps) => {
  return (
    <Popover className="relative">
      <Popover.Button as="div">
        <button
          className={clsx(
            "flex h-full w-max items-center justify-center rounded px-4 py-3 text-sm",
            initialActiveTimeTravel
              ? "bg-success bg-opacity-20 text-success"
              : "bg-manatee-100 text-manatee-400",
          )}
        >
          Time Travel <GrDown className="ml-1 h-4 w-4 opacity-30" />
        </button>
      </Popover.Button>
      <Popover.Panel className="bg-manatee absolute -left-6 z-[50] flex max-h-96 w-96 flex-col justify-between overflow-y-scroll rounded bg-white px-6 py-6 text-sm shadow-lg shadow-manatee-500">
        {({ close }) => (
          <TimeTravelSelectors
            initialActiveTimeTravel={initialActiveTimeTravel}
            save={setActiveDimensions}
            close={close}
          />
        )}
      </Popover.Panel>
    </Popover>
  );
};
