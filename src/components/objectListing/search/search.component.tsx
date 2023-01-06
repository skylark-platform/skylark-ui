import { VisibilityState } from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";

import { SearchFilter } from "src/components/objectListing/search/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { SkylarkObjectType } from "src/interfaces/skylark/objects";

import { SearchInput } from "./searchInput/searchInput.component";

interface SearchBarProps {
  searchQuery: string;
  activeFilters: SearchFilters;
  objectTypes: SkylarkObjectType[];
  columns: string[];
  visibleColumns: string[];
  className?: string;
  onQueryChange: (str: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  setColumnVisibility: (c: VisibilityState) => void;
}

export const Search = ({
  className,
  objectTypes,
  columns,
  visibleColumns,
  searchQuery,
  onQueryChange,
  activeFilters,
  onFilterChange,
  setColumnVisibility,
}: SearchBarProps) => {
  const [isFilterOpen, setFilterOpen] = useState(false);

  const filtersDivRef = useRef<HTMLDivElement>(null);

  const closeFilterOnClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        filtersDivRef.current &&
        !filtersDivRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    },
    [setFilterOpen],
  );

  useEffect(() => {
    // if (isFilterOpen) {
    document.addEventListener("mouseup", closeFilterOnClickOutside);
    return () => {
      document.removeEventListener("mouseup", closeFilterOnClickOutside);
    };
    // }
  }, []);

  return (
    <div className="relative w-full" ref={filtersDivRef}>
      <SearchInput
        className={className}
        onQueryChange={onQueryChange}
        searchQuery={searchQuery}
        toggleFilterOpen={() => setFilterOpen(!isFilterOpen)}
      />

      {isFilterOpen && (
        <div className="absolute top-14 left-0 z-50">
          <SearchFilter
            objectTypes={objectTypes}
            activeFilters={activeFilters}
            columns={columns}
            visibleColumns={visibleColumns}
            onFilterSave={onFilterChange}
            closeFilterDiv={() => setFilterOpen(false)}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      )}
    </div>
  );
};
