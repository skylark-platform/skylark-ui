import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import { DocumentNode } from "graphql";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import {
  AvailabilityDimensionsPicker,
  AvailabilityDimensionsPickerValues,
} from "src/components/inputs/availabilityDimensionsPicker/availabilityDimensionsPicker.component";
import { LanguageSelect } from "src/components/inputs/select";
import { SearchFilter } from "src/components/objectSearch/search/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject } from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

import { SearchInput } from "./searchInput/searchInput.component";

interface SearchBarProps {
  searchQuery: string;
  activeFilters: SearchFilters;
  columns: ColumnDef<ParsedSkylarkObject, ParsedSkylarkObject>[];
  columnIds: string[];
  visibleColumns: VisibilityState;
  activeDimensions: AvailabilityDimensionsPickerValues;
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
  onActiveDimensionsChange: (args: AvailabilityDimensionsPickerValues) => void;
  onRefresh: () => void;
}

export const Search = ({
  className,
  columns,
  columnIds,
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
  onActiveDimensionsChange,
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

  const columnOptions = columnIds.map((value) => ({
    value,
    label:
      columns.find((col) => col?.id === value)?.header?.toString() || value,
  }));

  return (
    <div
      className={clsx(
        "flex w-full flex-col items-center sm:h-10 sm:flex-row",
        className,
      )}
      ref={filtersDivRef}
    >
      <div className="relative flex h-full w-full flex-grow flex-row">
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
                columns={columnOptions}
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
        className="mt-2 w-full sm:ml-2 sm:mt-0 sm:w-auto"
        data-testid="object-listing-language-select-container"
      >
        <LanguageSelect
          variant="primary"
          name="object-listing-language-select"
          className="w-full md:w-36"
          selected={activeFilters.language}
          onChange={onLanguageChange}
          useDefaultLanguage
          onValueClear={() => onLanguageChange(null)}
        />
      </div>
      {hasProperty(query, "next") && (
        <div>
          <AvailabilityDimensionsPicker
            activeDimensions={activeFilters.availabilityDimensions}
            setActiveDimensions={onActiveDimensionsChange}
          />
        </div>
      )}
    </div>
  );
};
