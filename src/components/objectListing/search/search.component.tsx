import { VisibilityState } from "@tanstack/react-table";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { SearchFilter } from "src/components/objectListing/search/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { SkylarkObjectType } from "src/interfaces/skylark";

import { SearchInput } from "./searchInput/searchInput.component";

interface SearchBarProps {
  searchQuery: string;
  activeFilters: SearchFilters;
  objectTypes: SkylarkObjectType[];
  columns: string[];
  visibleColumns: string[];
  className?: string;
  onQueryChange: (str: string) => void;
  onFilterChange: (f: SearchFilters, c: VisibilityState) => void;
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
}: SearchBarProps) => {
  const [isFilterOpen, setFilterOpen] = useState(false);

  const filtersDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeFilterOnClickOutside = (e: MouseEvent) => {
      if (
        filtersDivRef.current &&
        !filtersDivRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mouseup", closeFilterOnClickOutside);
    return () => {
      document.removeEventListener("mouseup", closeFilterOnClickOutside);
    };
  }, [setFilterOpen]);

  const onFilterSaveWrapper = (
    filters: SearchFilters,
    columnVisibility: VisibilityState,
  ) => {
    setFilterOpen(false);
    onFilterChange(filters, columnVisibility);
  };

  return (
    <div className="relative w-full" ref={filtersDivRef}>
      <SearchInput
        className={className}
        onQueryChange={onQueryChange}
        searchQuery={searchQuery}
        toggleFilterOpen={() => setFilterOpen(!isFilterOpen)}
      />

      <AnimatePresence>
        {isFilterOpen && (
          <m.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="absolute top-10 left-0 z-50 w-full md:top-14 md:w-auto"
          >
            <SearchFilter
              objectTypes={objectTypes}
              activeFilters={activeFilters}
              columns={columns}
              visibleColumns={visibleColumns}
              onFilterSave={onFilterSaveWrapper}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
