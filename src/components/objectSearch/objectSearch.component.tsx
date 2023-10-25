import {
  ColumnOrderState,
  ColumnSizingInfoState,
  ColumnSizingState,
  PaginationState,
  TableState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, memo, useCallback } from "react";

import { Spinner } from "src/components/icons";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SearchFilters } from "src/hooks/useSearch";
import {
  SearchType,
  useSearchWithLookupType,
} from "src/hooks/useSearchWithLookupType";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import { useUserAccount } from "src/hooks/useUserAccount";
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
  initialSearchType?: SearchType;
  initialFilters?: Partial<SearchFilters>;
  initialColumnState?: Partial<ObjectSearchInitialColumnsState>;
  hideSearchFilters?: boolean;
  setPanelObject?: ObjectSearchResultsProps["setPanelObject"];
  checkedObjects?: ObjectSearchResultsProps["checkedObjects"];
  onObjectCheckedChanged?: ObjectSearchResultsProps["onObjectCheckedChanged"];
  onStateChange?: (s: {
    filters?: SearchFilters;
    columns?: ObjectSearchInitialColumnsState;
    searchType?: SearchType;
  }) => void;
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

const getSearchResultsText = ({
  searchType,
  isSearching,
  totalHits,
  searchQuery,
}: {
  searchType: SearchType;
  totalHits?: number;
  isSearching: boolean;
  searchQuery: string;
}) => {
  if (isSearching) {
    return "Loading...";
  }

  if (searchType === SearchType.UIDExtIDLookup) {
    if (!searchQuery) {
      return "Enter a lookup value";
    }
    return totalHits ? "Exact match found" : "No UID or External ID match";
  }

  return `${totalHits || 0} results`;
};

export const ObjectSearch = (props: ObjectSearchProps) => {
  const { defaultLanguage, isLoading: isUserLoading } = useUserAccount();

  const {
    setPanelObject,
    isPanelOpen,
    initialSearchType,
    initialFilters,
    initialColumnState,
    onObjectCheckedChanged,
    withObjectSelect,
    onStateChange,
  } = props;

  const withPanel = typeof setPanelObject !== "undefined";

  const { objectTypes } = useSkylarkObjectTypes(true);

  const [searchType, setSearchType] = useState<SearchType>(
    initialSearchType || SearchType.Search,
  );

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: initialFilters?.query || "",
    language: initialFilters?.language,
    objectTypes: initialFilters?.objectTypes || null,
    availability: initialFilters?.availability || {
      dimensions: null,
      timeTravel: null,
    },
  });

  const {
    data: searchData,
    error: searchError,
    isLoading,
    totalHits,
    properties,
    graphqlSearchQuery,
    isRefetching: searchRefetching,
    searchHash,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSearchWithLookupType({
    type: searchType,
    filters: {
      ...searchFilters,
      language:
        searchFilters.language === undefined
          ? defaultLanguage
          : searchFilters.language,
      objectTypes: searchFilters.objectTypes || objectTypes || null,
    },
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
      createObjectListingColumns(sortedHeaders, {
        withObjectSelect,
        withPanel,
      }),
    [sortedHeaders, withObjectSelect, withPanel],
  );

  const [tableState, setTableState] = useState<TableState>({
    columnVisibility: generateColumnVisibility(
      sortedHeaders,
      {},
      initialColumnState?.columns,
    ),
    columnOrder: initialColumnState?.order || initialColumnState?.columns || [],
    columnSizing: initialColumnState?.sizes || {},
    columnPinning: {
      left: initialColumnState?.frozen || initialFrozenColumns,
    },
    columnFilters: [],
    globalFilter: {},
    sorting: [],
    expanded: {},
    grouping: [],
    columnSizingInfo: {} as ColumnSizingInfoState,
    pagination: {} as PaginationState,
    rowSelection: {},
    rowPinning: {},
  });

  const handleSearchFilterChange = useCallback(
    ({
      filters,
      visibleColumns: updatedVisibleColumns,
      searchType,
    }: Partial<{
      filters: SearchFilters;
      visibleColumns: VisibilityState;
      searchType: SearchType;
    }>) => {
      const visibleColumns =
        updatedVisibleColumns &&
        Object.entries(updatedVisibleColumns)
          .filter(([, value]) => !!value)
          .map(([key]) => key);

      if (filters) {
        setSearchFilters(filters);
      }

      if (updatedVisibleColumns) {
        setTableState((prev) => ({
          ...prev,
          columnVisibility: updatedVisibleColumns,
        }));
      }

      if (searchType) {
        setSearchType(searchType);
      }

      onStateChange?.({
        searchType,
        filters,
        columns: visibleColumns && {
          order: tableState.columnOrder,
          columns: visibleColumns,
          frozen: tableState.columnPinning.left || [],
          sizes: tableState.columnSizing,
        },
      });
    },
    [
      onStateChange,
      tableState.columnOrder,
      tableState.columnPinning.left,
      tableState.columnSizing,
    ],
  );

  const handleTableStateChange = useCallback(
    (tableStateUpdater: Updater<TableState>) => {
      setTableState(tableStateUpdater);

      if (onStateChange) {
        const updatedTableState = handleUpdater(tableStateUpdater, tableState);

        const visibleColumns = Object.entries(
          updatedTableState.columnVisibility,
        )
          .filter(([, value]) => !!value)
          .map(([key]) => key);

        onStateChange({
          columns: {
            order: updatedTableState.columnOrder,
            columns: visibleColumns,
            frozen: updatedTableState.columnPinning.left || [],
            sizes: updatedTableState.columnSizing,
          },
        });
      }
    },
    [onStateChange, tableState],
  );

  const defaultColumnOrder = useMemo(
    () => parsedTableColumns.map((column) => column.id as string),
    [parsedTableColumns],
  );
  const columnOrder: ColumnOrderState = useMemo(
    () =>
      tableState.columnOrder.length > 0
        ? tableState.columnOrder
        : defaultColumnOrder,
    [defaultColumnOrder, tableState.columnOrder],
  );

  useEffect(() => {
    // Update the column visibility when new fields are added / removed
    const { columnVisibility } = tableState;
    if (sortedHeaders && sortedHeaders.length !== 0) {
      if (Object.keys(columnVisibility).length === 0) {
        handleTableStateChange({
          ...tableState,
          columnVisibility: generateColumnVisibility(
            sortedHeaders,
            columnVisibility,
            initialColumnState?.columns,
          ),
        });
        return;
      }

      const newColumnVisibility = generateColumnVisibility(
        sortedHeaders,
        columnVisibility,
      );
      if (!isObjectsDeepEqual(newColumnVisibility, columnVisibility)) {
        handleTableStateChange({
          ...tableState,
          columnVisibility: newColumnVisibility,
        });
      }
    }
  }, [
    handleTableStateChange,
    initialColumnState?.columns,
    sortedHeaders,
    tableState,
  ]);

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
            "md:max-w-full lg:max-w-[850px]",
          )}
        >
          <Search
            graphqlQuery={graphqlSearchQuery}
            isSearching={isSearching || searchRefetching}
            filters={{
              ...searchFilters,
              objectTypes: searchFilters.objectTypes || objectTypes || null,
            }}
            searchType={searchType}
            onRefresh={refetch}
            columns={parsedTableColumns}
            columnIds={sortedHeaders}
            visibleColumns={tableState.columnVisibility}
            hideFilters={props.hideSearchFilters}
            onChange={handleSearchFilterChange}
          />
          <div className="mt-2 flex w-full justify-start pl-3 md:pl-7">
            <p className="text-xs font-medium text-manatee-400">
              {getSearchResultsText({
                searchQuery: searchFilters.query,
                searchType,
                isSearching,
                totalHits,
              })}
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
            isSearching={isSearching}
            tableState={{
              ...tableState,
              columnOrder:
                tableState.columnOrder.length > 0
                  ? tableState.columnOrder
                  : defaultColumnOrder,
            }}
            setTableState={handleTableStateChange}
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
