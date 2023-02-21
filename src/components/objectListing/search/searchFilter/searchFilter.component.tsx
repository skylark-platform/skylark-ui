import { VisibilityState } from "@tanstack/react-table";
import { useState } from "react";

import { Button } from "src/components/button";
import {
  CheckboxGrid,
  createCheckboxOptions,
} from "src/components/checkboxGrid/checkboxGrid.component";
import { SearchFilters } from "src/hooks/useSearch";
import { SkylarkObjectType } from "src/interfaces/skylark";

interface SearchFilterProps {
  activeFilters: SearchFilters;
  objectTypes: SkylarkObjectType[];
  columns: string[];
  visibleColumns: string[];
  onFilterSave: (
    filters: SearchFilters,
    columnVisibility: VisibilityState,
  ) => void;
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
}: SearchFilterProps) => {
  const [updatedObjectTypes, updateObjectTypes] = useState<string[]>(
    activeFilters.objectTypes || [],
  );
  const [updatedVisibleColumns, updateVisibleColumns] =
    useState<string[]>(visibleColumns);

  // TODO we only need one call back here really (not onFilterSave, closeFilterDiv and setColumnVisibility)

  const makeFiltersActive = () => {
    onFilterSave(
      {
        objectTypes: updatedObjectTypes,
      },
      convertCheckedColumnsToVisibilityState(updatedVisibleColumns, columns),
    );
  };

  const resetAllFilters = () => {
    updateObjectTypes(objectTypes);
    updateVisibleColumns(columns);
  };

  return (
    // TODO figure out what width the filter should actually be
    <div className="flex max-h-96 w-full flex-col rounded bg-white p-2 text-xs shadow-lg shadow-manatee-500 md:max-h-96 md:w-[120%] lg:w-[150%] xl:max-h-[28rem]">
      <div className="flex-grow overflow-scroll border-none p-2 [&>section]:border-b-2 [&>section]:border-b-manatee-100 [&>section]:pt-3 [&>section]:pb-3 first:[&>section]:pt-0 last:[&>section]:border-none last:[&>section]:pb-0">
        <CheckboxGrid
          label="Object type"
          withToggleAll
          options={createCheckboxOptions(
            objectTypes.sort(),
            updatedObjectTypes,
          )}
          onChange={updateObjectTypes}
        />
        <CheckboxGrid
          label="Columns"
          withToggleAll
          options={createCheckboxOptions(columns, updatedVisibleColumns)}
          onChange={updateVisibleColumns}
        />
      </div>
      <div className="flex w-full justify-end space-x-4 px-4 pt-2">
        <Button variant="ghost" onClick={resetAllFilters}>
          Reset
        </Button>
        <Button
          variant="primary"
          onClick={makeFiltersActive}
          disabled={
            updatedObjectTypes.length === 0 ||
            updatedVisibleColumns.length === 0
          }
        >
          Apply
        </Button>
      </div>
    </div>
  );
};
