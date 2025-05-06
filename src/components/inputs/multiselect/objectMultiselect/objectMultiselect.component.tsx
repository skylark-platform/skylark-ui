import { DndContext } from "@dnd-kit/core";
import clsx from "clsx";
import { forwardRef, Ref, useCallback, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";

import {
  MultiSelect,
  MultiSelectOption,
  MultiSelectProps,
} from "src/components/inputs/multiselect/multiselect.component";
import { SearchObjectsModal } from "src/components/modals";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  SkylarkObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";

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
    className,
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

  const [inputQuery, setInputQuery] = useState("");

  const { objects: allObjectsMeta } = useAllObjectsMeta();
  const columns = useMemo(() => {
    const { global, translatable } = (allObjectsMeta || []).reduce(
      (prev, { name, fields }) => {
        if (!objectTypes.includes(name)) {
          return prev;
        }

        return {
          global: [...prev.global, ...fields.globalNames],
          translatable: [...prev.translatable, ...fields.translatableNames],
        };
      },
      { global: [] as string[], translatable: [] as string[] },
    );

    const columns = [
      ...new Set([...translatable, ...global]),
      OBJECT_LIST_TABLE.columnIds.dateCreated,
      OBJECT_LIST_TABLE.columnIds.dateModified,
      OBJECT_LIST_TABLE.columnIds.languageVersion,
      OBJECT_LIST_TABLE.columnIds.globalVersion,
    ];

    return columns;
  }, [allObjectsMeta, objectTypes]);

  return (
    <div
      className={clsx(
        "flex justify-center items-center overflow-x-hidden",
        className,
      )}
    >
      <MultiSelect
        {...props}
        ref={ref}
        className="w-full"
        selected={selectedUids}
        options={options}
        nothingFoundText={
          inputQuery ? `Search for "${inputQuery}"` : "Type something..."
        }
        renderInPortal
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
          existingCheckedState
          objectTypes={objectTypes}
          columns={
            columns.length > 0
              ? [OBJECT_LIST_TABLE.columnIds.displayField, ...columns]
              : undefined
          }
          closeModal={() => setSearchIsOpen(false)}
        />
      </DndContext>
    </div>
  );
};

export const ObjectMultiSelect = forwardRef(ObjectMultiSelectComponent);
