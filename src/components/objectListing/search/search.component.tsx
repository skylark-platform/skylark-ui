import { VisibilityState } from "@tanstack/react-table";
import { AnimatePresence, m } from "framer-motion";
import { DocumentNode } from "graphql";
import { useEffect, useRef, useState } from "react";

import { LanguageSelect } from "src/components/inputs/select";
import { SearchFilter } from "src/components/objectListing/search/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";

import { SearchInput } from "./searchInput/searchInput.component";

interface SearchBarProps {
  searchQuery: string;
  activeFilters: SearchFilters;
  columns: string[];
  visibleColumns: VisibilityState;
  className?: string;
  graphqlQuery: {
    query: DocumentNode | null;
    variables: object;
  };
  onQueryChange: (str: string) => void;
  onFilterChange: (f: SearchFilters, c: VisibilityState) => void;
}

export const Search = ({
  className,
  columns,
  visibleColumns,
  searchQuery,
  graphqlQuery,
  onQueryChange,
  activeFilters,
  onFilterChange,
}: SearchBarProps) => {
  const [isFilterOpen, setFilterOpen] = useState(false);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const filtersDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeFilterOnClickOutside = (e: MouseEvent) => {
      // If the GraphQL Query Modal is open, don't close the filters
      const graphqlQueryModalIsOpen = !!document.getElementById(
        "graphql-query-modal",
      );
      if (
        filtersDivRef.current &&
        !filtersDivRef.current.contains(e.target as Node) &&
        !graphqlQueryModalIsOpen
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
    <div className="relative flex w-full" ref={filtersDivRef}>
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
              activeFilters={activeFilters}
              columns={columns}
              visibleColumns={Object.keys(visibleColumns).filter(
                (column) => visibleColumns[column],
              )}
              graphqlQuery={graphqlQuery}
              objectTypesWithConfig={objectTypesWithConfig || []}
              onFilterSave={onFilterSaveWrapper}
            />
          </m.div>
        )}
      </AnimatePresence>
      <div className="ml-2">
        <LanguageSelect
          variant="primary"
          className="w-36"
          onChange={(language) =>
            onFilterChange({ ...activeFilters, language }, visibleColumns)
          }
          selected={activeFilters.language || ""}
          onValueClear={() =>
            onFilterChange({ ...activeFilters, language: null }, visibleColumns)
          }
        />
      </div>
    </div>
  );
};
