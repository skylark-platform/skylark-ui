import { VisibilityState } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";

import { Button } from "src/components/button";
import {
  CheckboxGrid,
  createCheckboxOptions,
} from "src/components/checkboxGrid/checkboxGrid.component";
import { SearchFilters } from "src/hooks/useSearch";
import { SkylarkObjectType } from "src/interfaces/skylark/objects";

interface SearchFilterProps {
  activeFilters: SearchFilters;
  objectTypes: SkylarkObjectType[];
  columns: string[];
  visibleColumns: string[];
  onFilterSave: (filters: SearchFilters) => void;
  closeFilterDiv: () => void;
  setColumnVisibility: (c: VisibilityState) => void;
}

const convertCheckedColumnsToVisibilityState = (
  checked: string[],
  columns: string[],
) =>
  checked.length > 0
    ? columns.reduce(
        (prev, col) => ({
          ...prev,
          [col]: checked.includes(col),
        }),
        {},
      )
    : {};

export const SearchFilter = ({
  activeFilters,
  objectTypes,
  columns,
  visibleColumns,
  onFilterSave,
  closeFilterDiv,
  setColumnVisibility,
}: SearchFilterProps) => {
  const filtersDivRef = useRef<HTMLDivElement>(null);
  const [updatedObjectTypes, updateObjectTypes] = useState<string[]>(
    activeFilters.objectTypes || [],
  );
  const [updatedVisibleColumns, updateVisibleColumns] =
    useState<string[]>(visibleColumns);

  const onFilterSaveWrapper = () => {
    closeFilterDiv();

    onFilterSave({
      objectTypes: updatedObjectTypes,
    });

    setColumnVisibility(
      convertCheckedColumnsToVisibilityState(updatedVisibleColumns, columns),
    );
  };

  const onFilterReset = () => {
    closeFilterDiv();
    onFilterSave({
      objectTypes,
    });
    setColumnVisibility(
      convertCheckedColumnsToVisibilityState(columns, columns),
    );
  };

  useEffect(() => {
    const closeFilterOnClickOutside = (e: MouseEvent) => {
      if (
        filtersDivRef.current &&
        !filtersDivRef.current.contains(e.target as Node)
      ) {
        closeFilterDiv();
      }
    };

    document.addEventListener("mousedown", closeFilterOnClickOutside);
    return () => {
      document.removeEventListener("mousedown", closeFilterOnClickOutside);
    };
  }, [closeFilterDiv]);

  return (
    <div
      className="absolute top-14 left-0 z-50 flex w-full flex-col rounded bg-white p-2 text-xs shadow-lg shadow-manatee-500 md:max-h-96 md:w-[120%] lg:w-[150%] xl:max-h-[28rem]"
      ref={filtersDivRef}
    >
      <div className="flex-grow overflow-scroll border-none p-2 [&>div]:border-b-2 [&>div]:border-b-manatee-100 [&>div]:pt-3 [&>div]:pb-3 first:[&>div]:pt-0 last:[&>div]:border-none last:[&>div]:pb-0">
        <CheckboxGrid
          label="Object type"
          options={createCheckboxOptions(objectTypes, updatedObjectTypes)}
          onChange={updateObjectTypes}
        />
        <CheckboxGrid
          label="Columns"
          options={createCheckboxOptions(columns, visibleColumns)}
          onChange={(opts) => updateVisibleColumns(opts)}
        />
      </div>
      <div className="flex w-full justify-end gap-2 px-4 pt-2">
        <Button variant="ghost" onClick={onFilterReset}>
          Reset
        </Button>
        <Button
          variant="primary"
          onClick={onFilterSaveWrapper}
          disabled={
            updatedObjectTypes.length === 0 || visibleColumns.length === 0
          }
        >
          Apply
        </Button>
      </div>
    </div>
  );
};
