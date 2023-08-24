import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import { DocumentNode } from "graphql";
import { useEffect, useRef, useState } from "react";

import { AvailabilityPicker } from "src/components/inputs/availabilityPicker/availabilityPicker.component";
import { LanguageSelect } from "src/components/inputs/select";
import { SearchFilter } from "src/components/objectSearch/search/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

import { SearchInput } from "./searchInput/searchInput.component";

interface SearchBarProps {
  filters: SearchFilters;
  columns: ColumnDef<ParsedSkylarkObject, ParsedSkylarkObject>[];
  columnIds: string[];
  visibleColumns: VisibilityState;
  className?: string;
  isSearching: boolean;
  graphqlQuery: {
    query: DocumentNode | null;
    variables: object;
  };
  hideFilters?: boolean;
  onChange: (
    o: Partial<{
      filters: SearchFilters;
      visibleColumns: VisibilityState;
    }>,
  ) => void;
  onRefresh: () => void;
}

export const Search = ({
  className,
  columns,
  columnIds,
  visibleColumns,
  graphqlQuery,
  isSearching,
  filters,
  hideFilters,
  onChange,
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

  const onFilterSave = (
    updatedFilters: Partial<SearchFilters>,
    updatedColumnVisibility?: VisibilityState,
  ) => {
    setFilterOpen(false);
    onChange({
      filters: {
        ...filters,
        ...updatedFilters,
      },
      visibleColumns: updatedColumnVisibility,
    });
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
          onQueryChange={(query) =>
            onChange({ filters: { ...filters, query } })
          }
          searchQuery={filters.query}
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
                activeObjectTypes={filters.objectTypes}
                columns={columnOptions}
                visibleColumns={Object.keys(visibleColumns).filter(
                  (column) => visibleColumns[column],
                )}
                graphqlQuery={graphqlQuery}
                objectTypesWithConfig={objectTypesWithConfig || []}
                onFilterSave={onFilterSave}
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className="mt-2 grid w-full grid-cols-2 gap-2 sm:ml-2 sm:mt-0 sm:flex sm:w-auto md:gap-0"
        data-testid="object-listing-language-select-container"
      >
        <LanguageSelect
          variant="primary"
          name="object-listing-language-select"
          className="w-full sm:mr-2 md:w-36"
          selected={filters.language}
          onChange={(language) =>
            onChange({ filters: { ...filters, language } })
          }
          useDefaultLanguage
          onValueClear={() =>
            onChange({
              filters: { ...filters, language: null },
            })
          }
        />
        <AvailabilityPicker
          activeValues={filters.availability}
          setActiveAvailability={(availability) =>
            onChange({ filters: { ...filters, availability } })
          }
        />
      </div>
    </div>
  );
};
