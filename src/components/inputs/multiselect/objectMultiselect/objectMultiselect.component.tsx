import { DndContext } from "@dnd-kit/core";
import { forwardRef, Ref, useCallback, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";

import {
  MultiSelect,
  MultiSelectOption,
  MultiSelectProps,
} from "src/components/inputs/multiselect/multiselect.component";
import { SearchObjectsModal } from "src/components/modals";
import { SkylarkObject, SkylarkObjectType } from "src/interfaces/skylark";

type ObjectMultiSelectProps = Omit<
  MultiSelectProps,
  "options" | "selected" | "onChange"
> & {
  objectTypes: SkylarkObjectType[];
  selectedObjects: SkylarkObject[];
  onChange: (objects: SkylarkObject[]) => void;
  showObjectTypeOnSelected?: boolean;
};

const ObjectMultiSelectComponent = (
  {
    objectTypes,
    selectedObjects,
    showObjectTypeOnSelected,
    onChange,
    ...props
  }: ObjectMultiSelectProps,
  ref: Ref<HTMLButtonElement | HTMLInputElement>,
) => {
  const [searchIsOpen, setSearchIsOpen] = useState(false);

  const { selectedUids, options } = useMemo(() => {
    const options: MultiSelectOption[] = selectedObjects.map(
      ({ uid, display }) => ({
        label: `${display.name || uid} ${showObjectTypeOnSelected ? `(${display.objectType})` : ""}`,
        value: uid,
        config: { colour: display.colour },
      }),
    );
    const selectedUids = options.map(({ value }) => value);

    return {
      options,
      selectedUids,
    };
  }, [selectedObjects, showObjectTypeOnSelected]);

  const onChangeWrapper = useCallback(
    (uids: string[]) => {
      onChange(selectedObjects.filter(({ uid }) => uids.includes(uid)));
    },
    [onChange, selectedObjects],
  );

  console.log({ objectTypes, selectedUids, selectedObjects });

  const [inputQuery, setInputQuery] = useState("");

  return (
    <div className="flex justify-center items-center">
      <MultiSelect
        {...props}
        ref={ref}
        selected={selectedUids}
        options={options}
        nothingFoundText={
          inputQuery ? `Search for "${inputQuery}"` : "Type something..."
        }
        onNothingFoundClick={() => inputQuery && setSearchIsOpen(true)}
        onChange={onChangeWrapper}
        onQueryChange={setInputQuery}
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
          initialSearchQuery={inputQuery}
          title={`Select objects`}
          onSave={({ checkedObjects }) => onChange(checkedObjects)}
          existingObjects={selectedObjects}
          objectTypes={objectTypes}
          closeModal={() => setSearchIsOpen(false)}
        />
      </DndContext>
    </div>
  );
};

export const ObjectMultiSelect = forwardRef(ObjectMultiSelectComponent);
