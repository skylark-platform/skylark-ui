import {
  ColumnOrderState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, memo, useCallback } from "react";

import { Spinner } from "src/components/icons";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useUser } from "src/contexts/useUser";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  SkylarkObjectTypes,
} from "src/interfaces/skylark";
import {
  hasProperty,
  isObjectsDeepEqual,
  shallowCompareObjects,
} from "src/lib/utils";

import { CreateButtons } from "./createButtons";
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

export interface ObjectSearchColumnsState {
  visibility: VisibilityState;
  order: ColumnOrderState;
  frozen: string[];
}

export interface ObjectSearchProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  isPanelOpen?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  initialFilters?: Partial<SearchFilters>;
  initialColumnState?: Partial<ObjectSearchColumnsState>;
  hideSearchFilters?: boolean;
  setPanelObject?: ObjectSearchResultsProps["setPanelObject"];
  checkedObjects?: ObjectSearchResultsProps["checkedObjects"];
  onObjectCheckedChanged?: ObjectSearchResultsProps["onObjectCheckedChanged"];
  onFilterChange?: (f: SearchFilters) => void;
  onColumnStateChange?: (c: ObjectSearchColumnsState) => void;
}

const initialFrozenColumns = [
  ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
  OBJECT_LIST_TABLE.columnIds.objectType,
  OBJECT_LIST_TABLE.columnIds.displayField,
];

const generateColumnVisibility = (
  sortedHeaders: string[],
  existingColumnVisibility: Record<string, boolean>,
  initialColumnVisibility?: Record<string, boolean>,
  newColumnVisibility?: boolean,
): VisibilityState => {
  const defaultVisibility: boolean =
    newColumnVisibility !== undefined ? newColumnVisibility : true;

  if (Object.keys(existingColumnVisibility).length === 0) {
    const columnVisibility = Object.fromEntries(
      sortedHeaders.map((header) => [
        header,
        initialColumnVisibility
          ? hasProperty(initialColumnVisibility, header) &&
            initialColumnVisibility[header]
          : defaultVisibility,
      ]),
    );

    return columnVisibility;
  }

  const columnVisibility = Object.fromEntries(
    sortedHeaders.map((header) => [
      header,
      hasProperty(existingColumnVisibility, header)
        ? existingColumnVisibility[header]
        : defaultVisibility,
    ]),
  );

  return columnVisibility;
};

const parseInitialColumnState = (
  sortedHeaders: string[],
  initialState?: Partial<ObjectSearchColumnsState>,
): ObjectSearchColumnsState => {
  const visibility = generateColumnVisibility(
    sortedHeaders,
    {},
    initialState?.visibility,
    initialState?.visibility ? false : undefined,
  );

  const frozen = initialState?.frozen
    ? [
        ...new Set([
          ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
          ...initialState.frozen,
        ]),
      ]
    : initialFrozenColumns;

  const order = initialState?.order
    ? [...new Set([...frozen, ...initialState.order])]
    : [];
  console.log("init", {
    visibility,
    frozen,
    order,
  });
  return {
    visibility,
    frozen,
    order,
  };
};

const handleUpdatedColumnState = (
  updaters: Partial<{
    visibility: Updater<VisibilityState>;
    order: Updater<ColumnOrderState>;
    frozen: string[];
  }>,
  previousState: ObjectSearchColumnsState,
): ObjectSearchColumnsState => {
  const updatedState: Partial<ObjectSearchColumnsState> = {};

  if (updaters.visibility) {
    const visibility =
      updaters.visibility instanceof Function
        ? updaters.visibility(previousState.visibility)
        : updaters.visibility;

    updatedState.visibility = visibility;
  }

  if (updaters.order) {
    const order =
      updaters.order instanceof Function
        ? updaters.order(previousState.order)
        : updaters.order;

    updatedState.order = order;
  }

  if (updaters.frozen) {
    updatedState.frozen = updaters.frozen;
  }

  return {
    ...previousState,
    ...updatedState,
  };
};

export const ObjectSearch = (props: ObjectSearchProps) => {
  const { defaultLanguage, isLoading: isUserLoading } = useUser();
  const {
    withCreateButtons,
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

  // useEffect(() => {
  //   if (objectTypes && objectTypes.length !== 0 && searchObjectTypes === null) {
  //     setSearchObjectTypes(objectTypes);
  //   }
  // }, [objectTypes, searchObjectTypes]);

  // const searchTab = {
  //   query: searchQuery,
  //   language: searchLanguage,
  //   objectTypes: searchObjectTypes,
  //   availability: searchAvailability,
  // };

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

  const [columnState, setColumnState] = useState<ObjectSearchColumnsState>(
    parseInitialColumnState(sortedHeaders, initialColumnState),
  );

  const setColumnStateWrapper = (
    updaters: Partial<{
      visibility: Updater<VisibilityState>;
      order: Updater<ColumnOrderState>;
      frozen: string[];
    }>,
  ) => {
    const updatedState = handleUpdatedColumnState(updaters, columnState);

    setColumnState(updatedState);
    onColumnStateChange?.(updatedState);
  };

  const defaultColumnOrder = useMemo(
    () => parsedTableColumns.map((column) => column.id as string),
    [parsedTableColumns],
  );
  const columnOrder: ColumnOrderState =
    columnState.order.length > 0 ? columnState.order : defaultColumnOrder;

  useEffect(() => {
    const columnVisibility = columnState.visibility;

    // Update the column visibility when new fields are added / removed
    if (sortedHeaders && sortedHeaders.length !== 0) {
      if (Object.keys(columnVisibility).length === 0) {
        setColumnStateWrapper({
          visibility: generateColumnVisibility(
            sortedHeaders,
            columnVisibility,
            initialColumnState?.visibility,
          ),
        });
        return;
      }

      const newColumnVisibility = generateColumnVisibility(
        sortedHeaders,
        columnVisibility,
      );
      if (!isObjectsDeepEqual(newColumnVisibility, columnVisibility)) {
        setColumnStateWrapper({ visibility: newColumnVisibility });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedHeaders, columnState.visibility, initialColumnState?.visibility]);

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
            withCreateButtons &&
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
            visibleColumns={columnState.visibility}
            hideFilters={props.hideSearchFilters}
            onColumnVisibilityChange={(visibility) =>
              setColumnStateWrapper({ visibility })
            }
          />
          <div className="mt-2 flex w-full justify-start pl-3 md:pl-7">
            <p className="text-xs font-medium text-manatee-400">
              {isSearching ? "Loading..." : `${totalHits || 0} results`}
            </p>
          </div>
        </div>
        {/* {withCreateButtons && (
          <CreateButtons
            className={clsx(
              "mb-2 justify-end md:mb-0",
              isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
            )}
            onObjectCreated={(obj) => {
              setPanelObject?.(obj);
            }}
          />
        )} */}
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
            columnVisibility={columnState.visibility}
            setColumnVisibility={(visibility) =>
              setColumnStateWrapper({ visibility })
            }
            frozenColumns={columnState.frozen}
            setFrozenColumns={(frozen) => setColumnStateWrapper({ frozen })}
            columnOrder={columnState.order}
            setColumnOrder={(order) => setColumnStateWrapper({ order })}
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
