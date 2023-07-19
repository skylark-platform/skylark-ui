import { Popover } from "@headlessui/react";
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

export type TimeTravelPickerValues = { start: string; end: string } | null;

interface TimeTravelPickerProps {
  activeTimeTravel: TimeTravelPickerValues;
  setActiveDimensions: (args: TimeTravelPickerValues) => void;
}

const TimeTravelSelectors = ({
  initialActiveTimeTravel,
  close,
  save,
}: {
  initialActiveTimeTravel: TimeTravelPickerValues;
  close: () => void;
  save: (args: TimeTravelPickerValues) => void;
}) => {
  const [activeTimeTravel, setActiveTimeTravel] = useState({
    start: initialActiveTimeTravel?.start
      ? parseDateTimeForHTMLForm(
          "datetime-local",
          initialActiveTimeTravel?.start,
        )
      : "",
    end: initialActiveTimeTravel?.end
      ? parseDateTimeForHTMLForm("datetime-local", initialActiveTimeTravel?.end)
      : "",
  });

  const onSave = () => {
    save(
      activeTimeTravel
        ? {
            start: activeTimeTravel.start
              ? (parseInputFieldValue(
                  activeTimeTravel.start,
                  "datetime",
                ) as string)
              : "",
            end:
              activeTimeTravel.start && activeTimeTravel.end
                ? (parseInputFieldValue(
                    activeTimeTravel.end,
                    "datetime",
                  ) as string)
                : "",
          }
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
        <div className="mb-6">
          <PanelFieldTitle text={"Time Travel"} />
          <input
            // aria-invalid={error ? "true" : "false"}
            onChange={(e) =>
              setActiveTimeTravel((oldValue) =>
                oldValue
                  ? {
                      ...oldValue,
                      start: e.target.value,
                    }
                  : { end: "", start: e.target.value },
              )
            }
            value={activeTimeTravel?.start}
            type="datetime-local"
            step="1"
            className="w-full rounded-sm bg-manatee-50 px-4 py-3"
          />
        </div>
        <div className="mb-6">
          <PanelFieldTitle text={"Time Travel End"} />
          <input
            // aria-invalid={error ? "true" : "false"}
            onChange={(e) =>
              setActiveTimeTravel((oldValue) =>
                oldValue
                  ? {
                      ...oldValue,
                      end: e.target.value,
                    }
                  : { start: "", end: e.target.value },
              )
            }
            value={activeTimeTravel?.end}
            type="datetime-local"
            step="1"
            className="w-full rounded-sm bg-manatee-50 px-4 py-3"
            disabled={!activeTimeTravel?.start}
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
        <Button variant="ghost" className="mx-4">
          Time Travel <GrDown className="ml-1 h-4 w-4" />
        </Button>
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
