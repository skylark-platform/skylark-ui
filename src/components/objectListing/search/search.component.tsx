import { VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
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
  isSearching: boolean;
  graphqlQuery: {
    query: DocumentNode | null;
    variables: object;
  };
  onQueryChange: (str: string) => void;
  onFilterChange: (f: SearchFilters, c: VisibilityState) => void;
  onRefresh: () => void;
}

export const Search = ({
  className,
  columns,
  visibleColumns,
  searchQuery,
  graphqlQuery,
  isSearching,
  onQueryChange,
  activeFilters,
  onFilterChange,
  onRefresh,
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
    <div
      className={clsx("flex w-full flex-col md:flex-row", className)}
      ref={filtersDivRef}
    >
      <div className="relative flex w-full flex-grow flex-row">
        <SearchInput
          onQueryChange={onQueryChange}
          searchQuery={searchQuery}
          isSearching={isSearching}
          toggleFilterOpen={() => setFilterOpen(!isFilterOpen)}
          onRefresh={onRefresh}
        />

        <AnimatePresence>
          {isFilterOpen && (
            <m.div
              key="search-filter"
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
      </div>
      <div
        className="mt-2 md:mt-0 md:ml-2"
        data-testid="object-listing-language-select-container"
      >
        <LanguageSelect
          variant="primary"
          name="object-listing-language-select"
          className="w-full md:w-36"
          useDefaultLanguage
          onChange={(language) =>
            onFilterChange({ ...activeFilters, language }, visibleColumns)
          }
          selected={activeFilters.language}
          onValueClear={() =>
            onFilterChange({ ...activeFilters, language: null }, visibleColumns)
          }
        />
      </div>
    </div>
  );
};
