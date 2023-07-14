import { Popover, Portal } from "@headlessui/react";
import { useState } from "react";
import { GrDown } from "react-icons/gr";

import { Button } from "src/components/button";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { Select } from "src/components/inputs/select";
import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";

// interface AvailabilityDimensionsPickerProps {}

export const AvailabilityDimensionsPicker = () => {
  const { dimensions, isLoading } = useAvailabilityDimensionsWithValues();

  const [activeValues, setActiveValues] = useState<Record<string, string>>({});

  console.log({ dimensions, isLoading });

  return (
    <Popover className="relative">
      <Popover.Button as="div">
        <Button variant="ghost" className="mx-4">
          Dimensions <GrDown className="ml-1 h-4 w-4" />
        </Button>
      </Popover.Button>

      <Popover.Panel className="bg-manatee absolute -left-6 z-[50] flex max-h-96 w-96 flex-col justify-between overflow-y-scroll rounded bg-white px-6 py-6 text-sm shadow-lg shadow-manatee-500">
        <div className="flex h-full flex-grow flex-col">
          {dimensions?.map(({ uid, title, slug, external_id, values }) => (
            <div key={uid} className="mb-6">
              <PanelFieldTitle text={title || slug || external_id || uid} />
              <Select
                variant="primary"
                options={values.map((value) => ({
                  label:
                    value.title || value.slug || value.external_id || value.uid,
                  value: value.uid,
                }))}
                selected={activeValues?.[uid]}
                onChange={(updatedValue) =>
                  setActiveValues({
                    ...activeValues,
                    [uid]: updatedValue,
                  })
                }
                disabled={isLoading}
                placeholder=""
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="primary"
            className="mt-4"
            // loading={isCreatingObject || isCreatingTranslation}
            type="submit"
            disabled={Object.values(activeValues).length === 0}
            success
          >
            Save
          </Button>
          <Button
            variant="outline"
            className="mt-4"
            type="button"
            danger
            // disabled={isCreatingObject || isCreatingTranslation}
            // onClick={closeModal}
          >
            Cancel
          </Button>
        </div>
      </Popover.Panel>
    </Popover>
  );
};
