import { ColumnOrderState, VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, memo } from "react";

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

export interface ObjectSearchProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  isPanelOpen?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  defaultObjectTypes?: SkylarkObjectTypes;
  defaultColumns?: string[];
  hideSearchFilters?: boolean;
  setPanelObject?: ObjectSearchResultsProps["setPanelObject"];
  checkedObjects?: ObjectSearchResultsProps["checkedObjects"];
  onObjectCheckedChanged?: ObjectSearchResultsProps["onObjectCheckedChanged"];
}

const initialFrozenColumns = [
  ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
  OBJECT_LIST_TABLE.columnIds.objectType,
  OBJECT_LIST_TABLE.columnIds.displayField,
];

const generateColumnVisibility = (
  sortedHeaders: string[],
  existingColumnVisibility: Record<string, boolean>,
  defaultColumns?: string[],
): VisibilityState => {
  if (Object.keys(existingColumnVisibility).length === 0) {
    const columnVisibility = Object.fromEntries(
      sortedHeaders.map((header) => [
        header,
        defaultColumns ? defaultColumns.includes(header) : true,
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

export const ObjectSearch = (props: ObjectSearchProps) => {
  const { defaultLanguage, isLoading: isUserLoading } = useUser();
  const {
    withCreateButtons,
    setPanelObject,
    isPanelOpen,
    defaultObjectTypes,
    defaultColumns,
    onObjectCheckedChanged,
    withObjectSelect,
  } = props;

  const withPanel = typeof setPanelObject !== "undefined";

  const { objectTypes } = useSkylarkObjectTypes(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLanguage, setSearchLanguage] =
    // undefined initially as null is a valid language
    useState<SearchFilters["language"]>(undefined);
  const [searchObjectTypes, setSearchObjectTypes] = useState<
    SearchFilters["objectTypes"]
  >(defaultObjectTypes || null);
  const [searchAvailabilityDimensions, setSearchAvailabilityDimensions] =
    useState<SearchFilters["availabilityDimensions"]>(null);

  useEffect(() => {
    if (objectTypes && objectTypes.length !== 0 && searchObjectTypes === null) {
      setSearchObjectTypes(objectTypes);
    }
  }, [objectTypes, searchObjectTypes]);

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
  } = useSearch(searchQuery, {
    language: searchLanguage === undefined ? defaultLanguage : searchLanguage,
    objectTypes: searchObjectTypes || objectTypes || null,
    availabilityDimensions: searchAvailabilityDimensions,
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
    Object.fromEntries(
      sortedHeaders.map((header) => [
        header,
        defaultColumns ? defaultColumns.includes(header) : true,
      ]),
    ),
  );

  const [frozenColumns, setFrozenColumns] =
    useState<string[]>(initialFrozenColumns);

  const [stateColumnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const defaultColumnOrder = parsedTableColumns.map(
    (column) => column.id as string,
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
            defaultColumns,
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
  }, [sortedHeaders, columnVisibility, defaultColumns]);

  if (searchError) console.error("Search Errors:", { searchError });

  return (
    <div
      className={clsx(
        "flex h-full flex-col space-y-2",
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
            "flex w-full flex-1 flex-col items-center justify-start space-x-0.5 md:space-x-1",
            withCreateButtons &&
              "md:max-w-[50vw] lg:max-w-[45vw] xl:max-w-[40vw]",
          )}
        >
          <Search
            searchQuery={searchQuery}
            graphqlQuery={{
              query: graphqlSearchQuery,
              variables: graphqlSearchQueryVariables,
            }}
            isSearching={isSearching || searchRefetching}
            onRefresh={refetch}
            onQueryChange={setSearchQuery}
            activeFilters={{
              objectTypes: searchObjectTypes,
              language: searchLanguage,
              availabilityDimensions: searchAvailabilityDimensions,
            }}
            columns={parsedTableColumns}
            columnIds={sortedHeaders}
            visibleColumns={columnVisibility}
            activeDimensions={searchAvailabilityDimensions}
            hideFilters={props.hideSearchFilters}
            onColumnVisibilityChange={setColumnVisibility}
            onLanguageChange={setSearchLanguage}
            onObjectTypeChange={setSearchObjectTypes}
            onActiveDimensionsChange={setSearchAvailabilityDimensions}
          />
          <div className="mt-2 flex w-full justify-start pl-3 md:pl-7">
            <p className="text-xs font-medium text-manatee-400">
              {isSearching ? "Loading..." : `${totalHits || 0} results`}
            </p>
          </div>
        </div>
        {withCreateButtons && (
          <CreateButtons
            className={clsx(
              "mb-2 justify-end md:mb-0",
              isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
            )}
            onObjectCreated={(obj) => {
              setPanelObject?.(obj);
            }}
          />
        )}
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
            setColumnVisibility={setColumnVisibility}
            frozenColumns={frozenColumns}
            setFrozenColumns={setFrozenColumns}
            columnOrder={columnOrder}
            setColumnOrder={setColumnOrder}
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
