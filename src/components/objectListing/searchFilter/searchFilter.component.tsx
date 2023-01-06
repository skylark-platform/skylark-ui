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
    activeFilters.objectTypes,
  );
  const [updatedVisibleColumns, updateVisibleColumns] =
    useState<string[]>(visibleColumns);

  const onFilterSaveWrapper = () => {
    closeFilterDiv();

    onFilterSave({
      objectTypes: updatedObjectTypes,
    });

    const cols =
      updatedVisibleColumns.length > 0
        ? columns.reduce(
            (prev, col) => ({
              ...prev,
              [col]: updatedVisibleColumns.includes(col),
            }),
            {},
          )
        : {};
    setColumnVisibility(cols);
  };

  const onFilterClear = () => {
    closeFilterDiv();
    onFilterSave({
      objectTypes: [],
    });
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
      <div className="flex-grow overflow-scroll p-2">
        <div className="mb-4 border-b-2 border-b-manatee-100 pb-3">
          <CheckboxGrid
            label="Object type"
            options={createCheckboxOptions(
              objectTypes,
              activeFilters.objectTypes,
            )}
            onChange={updateObjectTypes}
          />
        </div>
        <div className="mb-4 border-b-2 border-b-manatee-100 pb-3">
          <CheckboxGrid
            label="Columns"
            options={createCheckboxOptions(columns, visibleColumns)}
            onChange={(opts) => updateVisibleColumns(opts)}
          />
        </div>
      </div>
      <div className="flex w-full justify-end gap-2 px-4 pt-2">
        <Button variant="ghost" onClick={onFilterClear}>
          Clear
        </Button>
        <Button variant="primary" onClick={onFilterSaveWrapper}>
          Apply
        </Button>
      </div>
    </div>
  );
};
