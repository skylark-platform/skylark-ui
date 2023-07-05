import { CheckedState } from "@radix-ui/react-checkbox";
import {
  VisibilityState,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useRef, useState, useMemo, useCallback, useEffect, memo } from "react";
import { useVirtual } from "react-virtual";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { getObjectDisplayName, isObjectsDeepEqual } from "src/lib/utils";

import { Table } from "./table";
import {
  OBJECT_SEARCH_HARDCODED_COLUMNS,
  createObjectListingColumns,
} from "./table/columnConfiguration";

export interface ObjectSearchResultsProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  setPanelObject?: (obj: SkylarkObjectIdentifier) => void;
  fetchNextPage?: () => void;
  searchData?: ParsedSkylarkObject[];
  sortedHeaders: string[];
  hasNextPage?: boolean;
  columnVisibility: VisibilityState;
  onRowCheckChange?: ({
    object,
    checkedState,
  }: {
    object: ParsedSkylarkObject;
    checkedState: CheckedState;
  }) => void;
}

// https://github.com/TanStack/table/issues/4240
const emptyArray = [] as object[];

export const ObjectSearchResults = ({
  sortedHeaders,
  columnVisibility,
  panelObject,
  setPanelObject,
  searchData,
  withObjectSelect,
  withObjectEdit,
  hasNextPage,
  fetchNextPage,
  onRowCheckChange,
}: ObjectSearchResultsProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [rowInEditMode, setRowInEditMode] = useState("");

  const parsedColumns = useMemo(
    () =>
      createObjectListingColumns(
        sortedHeaders,
        OBJECT_SEARCH_HARDCODED_COLUMNS,
        {
          withObjectSelect,
        },
      ) as ColumnDef<object, ParsedSkylarkObject>[],
    [sortedHeaders, withObjectSelect],
  );

  const formattedSearchData = useMemo(() => {
    const searchDataWithDisplayField = searchData?.map((obj) => {
      return {
        ...obj,
        // When the object type is an image, we want to display its preview in the images tab
        images:
          obj.objectType === BuiltInSkylarkObjectType.SkylarkImage
            ? [obj.metadata]
            : obj.images,
        [OBJECT_LIST_TABLE.columnIds.displayField]: getObjectDisplayName(obj),
        [OBJECT_LIST_TABLE.columnIds.translation]: obj.meta.language,
      };
    });

    // Move all entries in .metadata into the top level as tanstack-table outputs a warning messaged saying nested properties that are undefined
    const searchDataWithTopLevelMetadata = searchDataWithDisplayField?.map(
      (obj) => ({
        ...obj.metadata,
        ...obj,
      }),
    );

    return searchDataWithTopLevelMetadata;
  }, [searchData]);

  const searchDataLength = searchData?.length || 0;
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        // once the user has scrolled within 500px of the bottom of the table, fetch more data if there is any
        if (
          hasNextPage &&
          fetchNextPage &&
          searchDataLength &&
          scrollHeight - scrollTop - clientHeight < 500
        ) {
          fetchNextPage();
        }
      }
    },
    [hasNextPage, fetchNextPage, searchDataLength],
  );

  // a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useReactTable({
    debugAll: false,
    data: formattedSearchData || emptyArray,
    columns: parsedColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    state: {
      columnVisibility,
    },
    meta: {
      onRowCheckChange,
      rowInEditMode,
      withObjectEdit: !!withObjectEdit,
      onObjectClick: setPanelObject,
      onEditClick(rowId) {
        setRowInEditMode(rowId);
      },
      onEditCancelClick() {
        setRowInEditMode("");
      },
    },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    estimateSize: useCallback(() => 42, []),
    overscan: 40,
  });

  const { virtualItems: virtualRows, totalSize: totalRows } = rowVirtualizer;

  return (
    <div
      className={clsx(
        "relative mb-6 flex w-full flex-col overflow-x-auto overscroll-none md:-ml-4",
      )}
      ref={tableContainerRef}
      data-testid="object-search-results"
      id="object-search-results"
      onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
    >
      <Table
        table={table}
        virtualRows={virtualRows}
        totalRows={totalRows}
        withCheckbox={withObjectSelect}
        isLoadingMore={hasNextPage}
        activeObject={panelObject || undefined}
        withDraggableRow={!!panelObject}
      />
    </div>
  );
};

const shallowCompare = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every((key) => obj1[key] === obj2[key]);

const ObjectSearchResultsPropsAreEqual = (
  prevProps: Readonly<ObjectSearchResultsProps>,
  nextProps: Readonly<ObjectSearchResultsProps>,
) => {
  const {
    withCreateButtons,
    withObjectSelect,
    withObjectEdit,
    panelObject,
    setPanelObject,
    fetchNextPage,
    searchData,
    sortedHeaders,
    columnVisibility,
    onRowCheckChange,
  } = nextProps;

  const isSearchDataSame = prevProps.searchData === searchData;
  const isPanelObjectSame = prevProps.panelObject === panelObject;
  const isWithCreateButtonsSame =
    prevProps.withCreateButtons === withCreateButtons;
  const isWithObjectEditSame = prevProps.withObjectEdit === withObjectEdit;
  const isSetPanelObjectSame = prevProps.setPanelObject === setPanelObject;
  const isWithObjectSelectSame =
    prevProps.withObjectSelect === withObjectSelect;
  const isFetchNextPageSame = prevProps.fetchNextPage === fetchNextPage;
  const isSortedHeadersSame = prevProps.sortedHeaders === sortedHeaders;
  const isColumnVisibilitySame =
    prevProps.columnVisibility === columnVisibility;
  const isOnRowCheckChangeSame =
    prevProps.onRowCheckChange === onRowCheckChange;

  const isShallowSame = shallowCompare(prevProps, nextProps);

  // console.log({
  //   prevProps,
  //   nextProps,
  //   isSame: prevProps === nextProps,

  //   isShallowSame,
  //   isDeepSame: isObjectsDeepEqual(prevProps, nextProps),
  //   props: {
  //     isPanelObjectSame,
  //     isSearchDataSame,
  //     isWithCreateButtonsSame,
  //     isWithObjectEditSame,
  //     isSetPanelObjectSame,
  //     isWithObjectSelectSame,
  //     isFetchNextPageSame,
  //     isSortedHeadersSame,
  //     isColumnVisibilitySame,
  //     isOnRowCheckChangeSame,
  //   },
  // });

  return isShallowSame;
};

export const MemoizedObjectSearchResults = memo(
  ObjectSearchResults,
  ObjectSearchResultsPropsAreEqual,
);
