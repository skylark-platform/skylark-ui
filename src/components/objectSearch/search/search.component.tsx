import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";
import { Portal } from "@headlessui/react";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { DocumentNode } from "graphql";
import { useState } from "react";

import { AvailabilityPicker } from "src/components/inputs/availabilityPicker/availabilityPicker.component";
import { LanguageSelect } from "src/components/inputs/select";
import { ObjectSearchTableData } from "src/components/objectSearch/results/columnConfiguration";
import { SearchFilter } from "src/components/objectSearch/search/searchFilter/searchFilter.component";
import { SearchFilters } from "src/hooks/useSearch";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";

import { SearchInput } from "./searchInput/searchInput.component";

interface SearchBarProps {
  filters: SearchFilters;
  columns: ColumnDef<ObjectSearchTableData, ObjectSearchTableData>[];
  columnIds: string[];
  visibleColumns: VisibilityState;
  className?: string;
  isSearching: boolean;
  searchType: SearchType;
  graphqlQuery: {
    query: DocumentNode | null;
    variables: object;
    headers: HeadersInit;
  };
  hideFilters?: boolean;
  onChange: (
    o: Partial<{
      filters: SearchFilters;
      visibleColumns: VisibilityState;
      searchType: SearchType;
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
  searchType,
  filters,
  hideFilters,
  onChange,
  onRefresh,
}: SearchBarProps) => {
  const [isFilterOpen, setFilterOpen] = useState(false);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const onFilterSave = ({
    filters: updatedFilters,
    columnVisibility: visibleColumns,
    searchType,
  }: {
    filters: Partial<SearchFilters>;
    columnVisibility?: VisibilityState;
    searchType: SearchType;
  }) => {
    setFilterOpen(false);
    onChange({
      filters: {
        ...filters,
        ...updatedFilters,
      },
      visibleColumns,
      searchType,
    });
  };

  const columnOptions = columnIds.map((value) => ({
    value,
    label:
      columns.find((col) => col?.id === value)?.header?.toString() || value,
  }));

  const { refs, floatingStyles, context } = useFloating({
    open: isFilterOpen,
    placement: "bottom-start",
    middleware: [offset(5), flip(), shift({ padding: 5 })],
    whileElementsMounted: autoUpdate,
    onOpenChange: setFilterOpen,
  });

  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <div
      className={clsx(
        "flex w-full flex-col items-center sm:h-10 sm:flex-row",
        className,
      )}
      ref={refs.setReference}
      {...getReferenceProps()}
    >
      <div className="relative flex h-full w-full flex-grow flex-row">
        <SearchInput
          onQueryChange={(query) =>
            onChange({ filters: { ...filters, query } })
          }
          searchType={searchType}
          searchQuery={filters.query}
          isSearching={isSearching}
          hideFilters={hideFilters}
          toggleFilterOpen={() => setFilterOpen(!isFilterOpen)}
          onRefresh={onRefresh}
        />
        <AnimatePresence>
          {isFilterOpen && (
            <Portal>
              <div
                key="search-filter"
                ref={refs.setFloating}
                style={{ ...floatingStyles }}
                {...getFloatingProps()}
                className="z-20"
              >
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                >
                  <SearchFilter
                    searchType={searchType}
                    activeObjectTypes={filters.objectTypes}
                    columns={columnOptions}
                    visibleColumns={Object.keys(visibleColumns).filter(
                      (column) => visibleColumns[column],
                    )}
                    graphqlQuery={graphqlQuery}
                    objectTypesWithConfig={objectTypesWithConfig || []}
                    onFilterSave={onFilterSave}
                  />
                </motion.div>
              </div>
            </Portal>
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
