import { useEffect, useRef, useState } from "react";

import { Button } from "src/components/button";
import { Checkbox } from "src/components/checkbox";
import {
  CheckboxGrid,
  createCheckboxOptions,
} from "src/components/checkboxGrid/checkboxGrid.component";
import { SearchFilters } from "src/hooks/useSearch";
import { SkylarkObjectType } from "src/interfaces/skylark/objects";

const option = {
  title: "Object type",
  type: "checkbox",
  options: [
    "Episode",
    "Brand",
    "Season",
    "Theme",
    "Genre",
    "People",
    "Credit",
    "Tag",
  ],
};

interface SearchFilterProps {
  activeFilters: SearchFilters;
  objectTypes: SkylarkObjectType[];
  onFilterSave: (filters: SearchFilters) => void;
  closeFilterDiv: () => void;
}

export const SearchFilter = ({
  activeFilters,
  objectTypes,
  onFilterSave,
  closeFilterDiv,
}: SearchFilterProps) => {
  const filtersDivRef = useRef<HTMLDivElement>(null);
  const [updatedObjectTypes, updateObjectTypes] = useState<string[]>(
    activeFilters.objectTypes,
  );

  const onFilterSaveWrapper = () => {
    closeFilterDiv();

    onFilterSave({
      objectTypes: updatedObjectTypes,
    });
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
      className="absolute top-14 left-0 z-50 flex max-h-96 w-full flex-col rounded bg-white p-2 text-xs shadow-lg shadow-manatee-500 md:w-[120%]"
      ref={filtersDivRef}
    >
      <div className="flex-grow overflow-scroll p-2">
        <div className="mb-4 border-b-2 border-b-manatee-100 pb-3">
          <h4 className="mb-4 font-semibold text-manatee-600">
            {option.title}
          </h4>
          <CheckboxGrid
            options={createCheckboxOptions(
              objectTypes,
              activeFilters.objectTypes,
            )}
            onChange={updateObjectTypes}
          />
        </div>
      </div>
      <div className="flex w-full justify-end gap-2 px-4 pb-2">
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
