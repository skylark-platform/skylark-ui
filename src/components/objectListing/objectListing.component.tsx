import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useVirtual } from "react-virtual";

import { Spinner } from "src/components/icons";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import { getObjectDisplayName, hasProperty } from "src/lib/utils";

import { createObjectListingColumns } from "./columnConfiguration";
import { CreateButtons } from "./createButtons";
import { Search } from "./search";
import { Table } from "./table";

const hardcodedColumns = [
  OBJECT_LIST_TABLE.columnIds.translation,
  OBJECT_LIST_TABLE.columnIds.availability,
  OBJECT_LIST_TABLE.columnIds.images,
];
const orderedKeys = ["uid", "external_id", "data_source_id", "type"];

export interface ObjectListProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
  isPanelOpen?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  setPanelObject?: (obj: SkylarkObjectIdentifier) => void;
  isDragging?: boolean;
}

export const ObjectList = ({
  withCreateButtons,
  withObjectSelect,
  withObjectEdit = false,
  panelObject,
  setPanelObject,
  isDragging,
  isPanelOpen,
}: ObjectListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { objectTypes } = useSkylarkObjectTypes(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    objectTypes: null,
    language: undefined, // undefined initially as null is a valid language
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: searchData,
    error: searchError,
    isLoading: searchLoading,
    totalHits,
    properties,
    query: graphqlSearchQuery,
    variables: graphqlSearchQueryVariables,
    hasNextPage,
    isFetchingNextPage,
    isRefetching: searchRefetching,
    refetch,
    fetchNextPage,
  } = useSearch(searchQuery, searchFilters);

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedHeaders = useMemo(() => {
    const orderedKeysThatExist = properties.filter((property) =>
      orderedKeys.includes(property),
    );

    const orderedProperties = properties.filter(
      (property) => !orderedKeys.includes(property),
    );

    return [...hardcodedColumns, ...orderedKeysThatExist, ...orderedProperties];
  }, [properties]);

  const parsedColumns = useMemo(
    () =>
      createObjectListingColumns(sortedHeaders, hardcodedColumns, {
        withObjectSelect,
      }),
    [sortedHeaders, withObjectSelect],
  );

  const [rowInEditMode, setRowInEditMode] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    Object.fromEntries(sortedHeaders.map((header) => [header, true])),
  );

  const formattedSearchData = useMemo(() => {
    const searchDataWithDisplayField = searchData?.map((obj) => {
      return {
        ...obj,
        // When the object type is an image, we want to display its preview in the images tab
        images: (
          [
            BuiltInSkylarkObjectType.SkylarkImage,
            BuiltInSkylarkObjectType.BetaSkylarkImage,
          ] as string[]
        ).includes(obj.objectType)
          ? [obj.metadata]
          : obj.images,
        [OBJECT_LIST_TABLE.columnIds.displayField]: getObjectDisplayName(obj),
        [OBJECT_LIST_TABLE.columnIds.translation]: obj.meta.language,
      };
    });

    // Move all entries in .metadata into the top level as tanstack-table outputs a warning messaged saying nested properties that are undefined
    const searchDataWithTopLevelMetadata = searchDataWithDisplayField.map(
      (obj) => ({
        ...obj.metadata,
        ...obj,
      }),
    );

    return searchDataWithTopLevelMetadata;
  }, [searchData]);

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        // once the user has scrolled within 500px of the bottom of the table, fetch more data if there is any
        if (
          searchData.length > 0 &&
          scrollHeight - scrollTop - clientHeight < 500 &&
          hasNextPage &&
          !searchLoading &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      }
    },
    [
      searchData.length,
      hasNextPage,
      searchLoading,
      isFetchingNextPage,
      fetchNextPage,
    ],
  );

  // a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useReactTable({
    debugAll: false,
    data: formattedSearchData || [],
    columns: searchData
      ? (parsedColumns as ColumnDef<object, ParsedSkylarkObject>[])
      : [],
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    state: {
      columnVisibility,
    },
    meta: {
      rowInEditMode,
      withObjectEdit,
      onEditClick(rowId) {
        setRowInEditMode(rowId);
      },
      onEditCancelClick() {
        setRowInEditMode("");
      },
    },
  });

  useEffect(() => {
    if (
      objectTypes &&
      objectTypes.length !== 0 &&
      searchFilters.objectTypes === null
    ) {
      setSearchFilters({ ...searchFilters, objectTypes: objectTypes });
    }
  }, [objectTypes, searchFilters]);

  useEffect(() => {
    // Update the column visibility when new fields are added
    if (sortedHeaders && sortedHeaders.length !== 0) {
      const headersWithoutVisibility = sortedHeaders.filter(
        (header) => !hasProperty(columnVisibility, header),
      );
      if (headersWithoutVisibility.length > 0) {
        const newColumns = Object.fromEntries(
          headersWithoutVisibility.map((header) => [header, true]),
        );
        setColumnVisibility({
          ...columnVisibility,
          ...newColumns,
        });
      }
    }
  }, [sortedHeaders, columnVisibility]);

  const onFilterChangeWrapper = (
    updatedFilters: SearchFilters,
    updatedColumnVisibility: VisibilityState,
  ) => {
    setSearchFilters(updatedFilters);
    setColumnVisibility(updatedColumnVisibility);
  };

  if (searchError) console.error("Search Errors:", { searchError });

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    estimateSize: useCallback(() => 40, []),
    overscan: 35,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

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
            withCreateButtons && "md:max-w-[50vw] xl:max-w-[45vw]",
          )}
        >
          <Search
            searchQuery={searchQuery}
            graphqlQuery={{
              query: graphqlSearchQuery,
              variables: graphqlSearchQueryVariables,
            }}
            isSearching={searchLoading || searchRefetching}
            onRefresh={refetch}
            onQueryChange={setSearchQuery}
            activeFilters={searchFilters}
            columns={sortedHeaders}
            visibleColumns={columnVisibility}
            onFilterChange={onFilterChangeWrapper}
          />
          <div className="mt-2 flex w-full justify-start pl-3 md:pl-7">
            <p className="text-xs font-medium text-manatee-400">
              {searchLoading ? "Loading..." : `${totalHits || 0} results`}
            </p>
          </div>
        </div>
        {withCreateButtons && (
          <CreateButtons
            className={clsx(
              "mb-2 justify-end md:mb-0 md:w-full",
              isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
            )}
            onObjectCreated={(obj) => {
              setPanelObject?.(obj);
            }}
          />
        )}
      </div>
      <div
        className={clsx(
          isDragging ? "overflow-hidden" : "overflow-x-auto",
          "relative mb-6 flex w-full flex-auto flex-grow flex-col overscroll-none md:-ml-4",
        )}
        ref={tableContainerRef}
        data-testid="table-container"
        onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
      >
        {!searchLoading && searchData && (
          <Table
            table={table}
            virtualRows={virtualRows}
            totalRows={totalSize}
            withCheckbox={withObjectSelect}
            isLoadingMore={hasNextPage || isFetchingNextPage}
            activeObject={panelObject || undefined}
            setPanelObject={setPanelObject}
            withDraggableRow={!!isPanelOpen}
          />
        )}
        {(searchLoading || searchData) && (
          <div className="items-top justify-left flex h-96 w-full flex-col space-y-2 text-sm text-manatee-600 md:text-base">
            {searchLoading && (
              <div className="flex w-full justify-center">
                <Spinner className="h-10 w-10 animate-spin" />
              </div>
            )}

            {!searchLoading && searchData && searchData.length === 0 && (
              <p className="md:ml-6">{`No results containing all your search terms were found.`}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
