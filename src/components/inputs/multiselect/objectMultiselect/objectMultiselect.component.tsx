import { DndContext } from "@dnd-kit/core";
import { forwardRef, Ref, useCallback, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";

import { SearchObjectsModal } from "src/components/modals";
import { ParsedSkylarkObject, SkylarkObjectType } from "src/interfaces/skylark";

import { MultiSelect, MultiSelectProps } from "src/components/inputs/multiselect/multiselect.component";

type ObjectMultiSelectProps = Omit<
  MultiSelectProps,
  "options" | "selected" | "onChange"
> & {
  objectTypes: SkylarkObjectType[];
  selectedObjects: ParsedSkylarkObject[];
  onChange: (objects: ParsedSkylarkObject[]) => void;
};

const ObjectMultiSelectComponent = (
  { objectTypes, selectedObjects, onChange, ...props }: ObjectMultiSelectProps,
  ref: Ref<HTMLButtonElement | HTMLInputElement>,
) => {
  const [searchIsOpen, setSearchIsOpen] = useState(false);

  const { selectedUids, options } = useMemo(() => {
    const options = selectedObjects.map(({ uid }) => ({
      label: uid,
      value: uid,
    }));
    const selectedUids = options.map(({ value }) => value);

    return {
      options,
      selectedUids,
    };
  }, []);

  const onChangeWrapper = useCallback((uids: string[]) => {
    onChange(selectedObjects.filter(({ uid }) => uids.includes(uid)));
  }, []);

  console.log({ objectTypes });

  return (
    <div className="flex justify-center items-center">
      <MultiSelect
        {...props}
        ref={ref}
        selected={selectedUids}
        options={options}
        onChange={onChangeWrapper}
      />
      <button
        onClick={() => setSearchIsOpen(true)}
        className="p-2 rounded-full bg-manatee-100 ml-1"
      >
        <FiSearch className="text-base" />
      </button>
      <DndContext>
        <SearchObjectsModal
          isOpen={searchIsOpen}
          title="test"
          onSave={console.log}
          existingObjects={selectedObjects}
          objectTypes={objectTypes}
          closeModal={() => setSearchIsOpen(false)}
        />
      </DndContext>
    </div>
  );
};

export const ObjectMultiSelect = forwardRef(ObjectMultiSelectComponent);
