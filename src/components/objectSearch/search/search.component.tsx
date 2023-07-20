import { VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import { DocumentNode } from "graphql";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import {
  AvailabilityPicker,
  AvailabilityDimensionsPickerValues,
  AvailabilityPickerValues,
} from "src/components/inputs/availabilityPicker/availabilityPicker.component";
import { LanguageSelect } from "src/components/inputs/select";
import {
  TimeTravelPicker,
  TimeTravelPickerValues,
} from "src/components/inputs/timeTravelPicker/timeTravelPicker.component";
import { SearchFilter } from "src/components/objectSearch/search/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { hasProperty } from "src/lib/utils";

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
  hideFilters?: boolean;
  onQueryChange: (str: string) => void;
  onColumnVisibilityChange: (c: VisibilityState) => void;
  onLanguageChange: (l: SearchFilters["language"]) => void;
  onObjectTypeChange: (o: SearchFilters["objectTypes"]) => void;
  onActiveAvailabilityChange: (args: AvailabilityPickerValues) => void;
  onRefresh: () => void;
}

export const Search = ({
  className,
  columns,
  visibleColumns,
  searchQuery,
  graphqlQuery,
  isSearching,
  activeFilters,
  hideFilters,
  onQueryChange,
  onColumnVisibilityChange,
  onLanguageChange,
  onObjectTypeChange,
  onActiveAvailabilityChange,
  onRefresh,
}: SearchBarProps) => {
  const { query } = useRouter();

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
    objectTypes: SearchFilters["objectTypes"],
    columnVisibility: VisibilityState,
  ) => {
    setFilterOpen(false);
    onObjectTypeChange(objectTypes);
    onColumnVisibilityChange(columnVisibility);
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
          hideFilters={hideFilters}
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
              className="absolute left-0 top-10 z-50 w-full md:top-14 md:w-auto"
            >
              <SearchFilter
                activeObjectTypes={activeFilters.objectTypes}
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
      <div className="flex flex-row space-x-2">
        <div
          className={clsx(
            "mt-2 md:ml-2 md:mt-0",
            hasProperty(query, "next") ? "w-1/2 md:w-32" : "w-full",
          )}
          data-testid="object-listing-language-select-container"
        >
          <LanguageSelect
            variant="primary"
            name="object-listing-language-select"
            className="w-full"
            selected={activeFilters.language}
            onChange={onLanguageChange}
            buttonClassName="rounded-full"
            useDefaultLanguage
            onValueClear={() => onLanguageChange(null)}
          />
        </div>
        {hasProperty(query, "next") && (
          <div className="mt-2 w-1/2 md:ml-2 md:mt-0">
            <AvailabilityPicker
              activeValues={activeFilters.availability}
              setActiveAvailability={onActiveAvailabilityChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
