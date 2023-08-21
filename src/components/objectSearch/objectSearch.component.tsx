import {
  ColumnOrderState,
  ColumnSizingState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, memo } from "react";

import { Spinner } from "src/components/icons";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useUser } from "src/contexts/useUser";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";
import {
  hasProperty,
  isObjectsDeepEqual,
  shallowCompareObjects,
} from "src/lib/utils";

import {
  OBJECT_SEARCH_HARDCODED_COLUMNS,
  OBJECT_SEARCH_ORDERED_KEYS,
  OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
  createObjectListingColumns,
} from "./results/columnConfiguration";
import {
  MemoizedObjectSearchResults,
  ObjectSearchResultsProps,
} from "./results/objectSearchResults.component";
import { Search } from "./search";

export interface ObjectSearchInitialColumnsState {
  columns: string[];
  order?: string[];
  frozen: string[];
  sizes?: ColumnSizingState;
}

export interface ObjectSearchProps {
  withObjectSelect?: boolean;
  isPanelOpen?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  initialFilters?: Partial<SearchFilters>;
  initialColumnState?: Partial<ObjectSearchInitialColumnsState>;
  hideSearchFilters?: boolean;
  setPanelObject?: ObjectSearchResultsProps["setPanelObject"];
  checkedObjects?: ObjectSearchResultsProps["checkedObjects"];
  onObjectCheckedChanged?: ObjectSearchResultsProps["onObjectCheckedChanged"];
  onFilterChange?: (f: SearchFilters) => void;
  onColumnStateChange?: (c: ObjectSearchInitialColumnsState) => void;
}

const initialFrozenColumns = [
  ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
  OBJECT_LIST_TABLE.columnIds.objectType,
  OBJECT_LIST_TABLE.columnIds.displayField,
];

const generateColumnVisibility = (
  sortedHeaders: string[],
  existingColumnVisibility: Record<string, boolean>,
  initialVisibleColumns?: string[],
): VisibilityState => {
  if (Object.keys(existingColumnVisibility).length === 0) {
    const columnVisibility = Object.fromEntries(
      sortedHeaders.map((header) => [
        header,
        initialVisibleColumns ? initialVisibleColumns.includes(header) : true,
      ]),
    );

    return columnVisibility;
  }

  const columnVisibility = Object.fromEntries(
    sortedHeaders.map((header) => [
      header,
      hasProperty(existingColumnVisibility, header)
        ? existingColumnVisibility[header]
        : true,
    ]),
  );

  return columnVisibility;
};

const handleUpdater = function <T>(updater: Updater<T>, prevValue: T) {
  return updater instanceof Function ? updater(prevValue) : updater;
};

export const ObjectSearch = (props: ObjectSearchProps) => {
  const { defaultLanguage, isLoading: isUserLoading } = useUser();
  const {
    setPanelObject,
    isPanelOpen,
    initialFilters,
    initialColumnState,
    onObjectCheckedChanged,
    withObjectSelect,
    onFilterChange,
    onColumnStateChange,
  } = props;

  const withPanel = typeof setPanelObject !== "undefined";

  const { objectTypes } = useSkylarkObjectTypes(true);

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: initialFilters?.query || "",
    language: initialFilters?.language,
    objectTypes: initialFilters?.objectTypes || null,
    availability: initialFilters?.availability || {
      dimensions: null,
      timeTravel: null,
    },
  });

  const setSearchFiltersWrapper = (updatedFilters: SearchFilters) => {
    setSearchFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const {
    data: searchData,
    error: searchError,
    isLoading,
    totalHits,
    properties,
    query: graphqlSearchQuery,
    variables: graphqlSearchQueryVariables,
    isRefetching: searchRefetching,
    searchHash,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSearch({
    ...searchFilters,
    language:
      searchFilters.language === undefined
        ? defaultLanguage
        : searchFilters.language,
    objectTypes: searchFilters.objectTypes || objectTypes || null,
  });

  useEffect(() => {
    onObjectCheckedChanged?.([]);
    // We only want to trigger this useEffect when the searchHash has changed (not resetRowsChecked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchHash]);

  const isSearching = isLoading || isUserLoading;

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedHeaders = useMemo(() => {
    if (!properties) {
      return [];
    }

    const orderedKeysThatExist =
      properties?.filter((property) =>
        OBJECT_SEARCH_ORDERED_KEYS.includes(property),
      ) || [];

    const orderedProperties =
      properties?.filter(
        (property) => !OBJECT_SEARCH_ORDERED_KEYS.includes(property),
      ) || [];

    const headers = [
      ...OBJECT_SEARCH_HARDCODED_COLUMNS,
      ...orderedKeysThatExist,
      ...orderedProperties,
    ];

    return headers;
  }, [properties]);

  const parsedTableColumns = useMemo(
    () =>
      createObjectListingColumns(
        sortedHeaders,
        OBJECT_SEARCH_HARDCODED_COLUMNS,
        {
          withObjectSelect,
          withPanel,
        },
      ),
    [sortedHeaders, withObjectSelect, withPanel],
  );

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    generateColumnVisibility(sortedHeaders, {}, initialColumnState?.columns),
  );

  const [frozenColumns, setFrozenColumns] = useState<string[]>(
    initialColumnState?.frozen || initialFrozenColumns,
  );

  const [stateColumnOrder, setColumnOrder] = useState<ColumnOrderState>(
    initialColumnState?.order || initialColumnState?.columns || [],
  );

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    initialColumnState?.sizes || {},
  );

  const handleColumnStateChange = ({
    columnOrderUpdater,
    columnVisibilityUpdater,
    columnSizingUpdater,
    updatedFrozenColumns,
  }: Partial<{
    columnOrderUpdater: Updater<ColumnOrderState>;
    columnVisibilityUpdater: Updater<VisibilityState>;
    columnSizingUpdater: Updater<ColumnSizingState>;
    updatedFrozenColumns: string[];
  }>) => {
    if (columnOrderUpdater) {
      setColumnOrder((prevColumnOrder) =>
        handleUpdater(columnOrderUpdater, prevColumnOrder),
      );
    }

    if (columnVisibilityUpdater) {
      setColumnVisibility((prevVisibility) =>
        handleUpdater(columnVisibilityUpdater, prevVisibility),
      );
    }

    if (columnSizingUpdater) {
      setColumnSizing((prevColumnSizing) =>
        handleUpdater(columnSizingUpdater, prevColumnSizing),
      );
    }

    if (updatedFrozenColumns) {
      setFrozenColumns(updatedFrozenColumns);
    }

    if (onColumnStateChange) {
      const visibleColumns = Object.entries(
        columnVisibilityUpdater
          ? handleUpdater(columnVisibilityUpdater, columnVisibility)
          : columnVisibility,
      )
        .filter(([, value]) => !!value)
        .map(([key]) => key);

      const updatedColumnState: ObjectSearchInitialColumnsState = {
        order: columnOrderUpdater
          ? handleUpdater(columnOrderUpdater, columnOrder)
          : columnOrder,
        columns: visibleColumns,
        frozen: updatedFrozenColumns ? updatedFrozenColumns : frozenColumns,
        sizes: columnSizingUpdater
          ? handleUpdater(columnSizingUpdater, columnSizing)
          : columnSizing,
      };

      onColumnStateChange(updatedColumnState);
    }
  };

  const defaultColumnOrder = useMemo(
    () => parsedTableColumns.map((column) => column.id as string),
    [parsedTableColumns],
  );
  const columnOrder: ColumnOrderState =
    stateColumnOrder.length > 0 ? stateColumnOrder : defaultColumnOrder;

  useEffect(() => {
    // Update the column visibility when new fields are added / removed
    if (sortedHeaders && sortedHeaders.length !== 0) {
      if (Object.keys(columnVisibility).length === 0) {
        setColumnVisibility(
          generateColumnVisibility(
            sortedHeaders,
            columnVisibility,
            initialColumnState?.columns,
          ),
        );
        return;
      }

      const newColumnVisibility = generateColumnVisibility(
        sortedHeaders,
        columnVisibility,
      );
      if (!isObjectsDeepEqual(newColumnVisibility, columnVisibility)) {
        setColumnVisibility(newColumnVisibility);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedHeaders, setColumnVisibility, initialColumnState?.columns]);

  if (searchError) console.error("Search Errors:", { searchError });

  return (
    <div
      className={clsx(
        "flex h-full w-full flex-col space-y-2",
        isPanelOpen ? "lg:space-y-2" : "md:space-y-2",
      )}
    >
      <div
        className={clsx(
          "flex w-full flex-col-reverse items-end space-x-2 md:flex-row md:items-start md:justify-between",
          isPanelOpen ? "lg:flex-row" : "pr-2 md:flex-row md:pr-8",
        )}
      >
        <div
          className={clsx(
            "flex w-full flex-col items-center justify-start space-x-0.5 md:space-x-1",
            "md:max-w-[50vw] lg:max-w-[45vw] xl:max-w-[40vw]",
          )}
        >
          <Search
            graphqlQuery={{
              query: graphqlSearchQuery,
              variables: graphqlSearchQueryVariables,
            }}
            isSearching={isSearching || searchRefetching}
            filters={{
              ...searchFilters,
              objectTypes: searchFilters.objectTypes || objectTypes || null,
            }}
            onFiltersChange={setSearchFiltersWrapper}
            onRefresh={refetch}
            columns={parsedTableColumns}
            columnIds={sortedHeaders}
            visibleColumns={columnVisibility}
            hideFilters={props.hideSearchFilters}
            onColumnVisibilityChange={(columnVisibilityUpdater) =>
              handleColumnStateChange({ columnVisibilityUpdater })
            }
          />
          <div className="mt-2 flex w-full justify-start pl-3 md:pl-7">
            <p className="text-xs font-medium text-manatee-400">
              {isSearching ? "Loading..." : `${totalHits || 0} results`}
            </p>
          </div>
        </div>
      </div>
      {sortedHeaders.length > 0 && (
        <div
          className={clsx(
            "flex grow flex-col overflow-hidden",
            columnOrder.length > 0 &&
              columnOrder[0] === OBJECT_LIST_TABLE.columnIds.dragIcon &&
              "md:-ml-6",
          )}
        >
          <MemoizedObjectSearchResults
            {...props}
            key={searchHash} // This will rerender all results when the searchHash changes - importantly clearing the checkboxes back to an unchecked state
            tableColumns={parsedTableColumns}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            searchData={searchData}
            columnVisibility={columnVisibility}
            setColumnVisibility={(columnVisibilityUpdater) =>
              handleColumnStateChange({ columnVisibilityUpdater })
            }
            frozenColumns={frozenColumns}
            setFrozenColumns={(updatedFrozenColumns) =>
              handleColumnStateChange({ updatedFrozenColumns })
            }
            columnOrder={columnOrder}
            setColumnOrder={(columnOrderUpdater) =>
              handleColumnStateChange({ columnOrderUpdater })
            }
            columnSizing={columnSizing}
            setColumnSizing={(columnSizingUpdater) =>
              handleColumnStateChange({ columnSizingUpdater })
            }
          />
        </div>
      )}
      {(isSearching || (searchData && searchData.length === 0)) && (
        <div className="items-top justify-left flex h-96 w-full flex-col space-y-2 text-sm text-manatee-600 md:text-base">
          {isSearching && (
            <div
              className="flex w-full justify-center"
              data-testid="object-search-loading-spinner"
            >
              <Spinner className="h-10 w-10 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const objectSearchPropsAreEqual = (
  prevProps: Readonly<ObjectSearchProps>,
  nextProps: Readonly<ObjectSearchProps>,
) => {
  const isShallowSame = shallowCompareObjects(prevProps, nextProps);
  return isShallowSame;
};

export const MemoizedObjectSearch = memo(
  ObjectSearch,
  objectSearchPropsAreEqual,
);
