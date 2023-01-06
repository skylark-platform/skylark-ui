import { VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { Filter, Search } from "src/components/icons";
import { SearchFilter } from "src/components/objectListing/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { SkylarkObjectType } from "src/interfaces/skylark/objects";

interface SearchBarProps {
  activeFilters: SearchFilters;
  objectTypes: SkylarkObjectType[];
  columns: string[];
  visibleColumns: string[];
  className?: string;
  onQueryChange: (str: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  setColumnVisibility: (c: VisibilityState) => void;
}

export const SearchBar = ({
  className,
  objectTypes,
  columns,
  visibleColumns,
  onQueryChange,
  activeFilters,
  onFilterChange,
  setColumnVisibility,
}: SearchBarProps) => {
  const [isFilterOpen, setFilterOpen] = useState(false);

  return (
    <div
      // Use search bar container as ref so that we can type while filters are open
      className={clsx(
        "relative flex w-full flex-row items-center justify-center rounded-full bg-manatee-50 text-sm",
        className,
      )}
    >
      <Search className="ml-6 h-5" />
      <input
        type="text"
        placeholder="Search for an object(s)"
        className="flex-grow rounded-none bg-inherit p-3 focus:-outline-offset-1 focus:outline-brand-primary"
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <button
        className="flex items-center justify-center gap-2 rounded-r-full bg-manatee-200 p-3 px-10"
        onClick={() => setFilterOpen(true)}
      >
        <Filter />
        <span className="font-medium">
          Filters
          {/* : <span className="text-brand-primary">0</span> */}
        </span>
      </button>

      {/* TODO 120% width?? */}
      {isFilterOpen && (
        <SearchFilter
          objectTypes={objectTypes}
          activeFilters={activeFilters}
          columns={columns}
          visibleColumns={visibleColumns}
          onFilterSave={onFilterChange}
          closeFilterDiv={() => setFilterOpen(false)}
          setColumnVisibility={setColumnVisibility}
        />
      )}
    </div>
  );
};
