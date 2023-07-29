import { CheckedState } from "@radix-ui/react-checkbox";
import {
  VisibilityState,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  Row,
} from "@tanstack/react-table";
import clsx from "clsx";
import {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
  memo,
  Fragment,
} from "react";
import { useVirtual } from "react-virtual";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { PanelTab } from "src/hooks/state";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import {
  getObjectDisplayName,
  hasProperty,
  shallowCompareObjects,
  skylarkObjectsAreSame,
} from "src/lib/utils";

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
  setPanelObject?: (obj: SkylarkObjectIdentifier, tab?: PanelTab) => void;
  fetchNextPage?: () => void;
  searchData?: ParsedSkylarkObject[];
  sortedHeaders: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  columnVisibility: VisibilityState;
  checkedObjects?: ParsedSkylarkObject[];
  onObjectCheckedChanged?: (o: ParsedSkylarkObject[]) => void;
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
  checkedObjects,
  isFetchingNextPage,
  onObjectCheckedChanged,
}: ObjectSearchResultsProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [rowInEditMode, setRowInEditMode] = useState("");

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

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
      const { config } = objectTypesWithConfig?.find(
        ({ objectType }) => objectType === obj.objectType,
      ) || { config: obj.config };
      return {
        ...obj,
        // When the object type is an image, we want to display its preview in the images tab
        images:
          obj.objectType === BuiltInSkylarkObjectType.SkylarkImage
            ? [obj.metadata]
            : obj.images,
        [OBJECT_LIST_TABLE.columnIds.displayField]: getObjectDisplayName({
          ...obj,
          config,
        }),
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
  }, [objectTypesWithConfig, searchData]);

  const searchDataLength = searchData?.length || 0;
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        // once the user has scrolled within 500px of the bottom of the table, fetch more data if there is any
        if (
          hasNextPage &&
          fetchNextPage &&
          !isFetchingNextPage &&
          searchDataLength &&
          scrollHeight - scrollTop - clientHeight < 1000
        ) {
          fetchNextPage();
        }
      }
    },
    [hasNextPage, fetchNextPage, searchDataLength, isFetchingNextPage],
  );

  // a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const onRowCheckChange = useCallback(
    ({
      object,
      checkedState,
    }: {
      object: ParsedSkylarkObject;
      checkedState: CheckedState;
    }) => {
      if (onObjectCheckedChanged && checkedObjects) {
        if (checkedState) {
          onObjectCheckedChanged([...checkedObjects, object]);
        } else {
          onObjectCheckedChanged(
            checkedObjects.filter((obj) => !skylarkObjectsAreSame(obj, object)),
          );
        }
      }
    },
    [checkedObjects, onObjectCheckedChanged],
  );

  const checkedRows = useMemo(() => {
    return withObjectSelect && checkedObjects && searchData
      ? checkedObjects.map((checkedObj) =>
          searchData.findIndex((searchDataObj) =>
            skylarkObjectsAreSame(checkedObj, searchDataObj),
          ),
        )
      : [];
  }, [checkedObjects, searchData, withObjectSelect]);

  const batchCheckRows = useCallback(
    (type: "shift" | "clear-all", rowIndex?: number) => {
      if (onObjectCheckedChanged) {
        if (
          type === "shift" &&
          rowIndex !== undefined &&
          checkedObjects &&
          searchData
        ) {
          // We want to find the last checked row before the given index
          const reverseSortedCheckedRows = checkedRows.sort((a, b) => b - a);
          const firstSmallerIndex = reverseSortedCheckedRows.findIndex(
            (val) => val < rowIndex,
          );

          // Once found, we check all boxes after the previous row until and including the given index
          const objectsToCheck = searchData.slice(
            reverseSortedCheckedRows[firstSmallerIndex] + 1 || 0,
            rowIndex + 1,
          );

          onObjectCheckedChanged([...checkedObjects, ...objectsToCheck]);
        }

        if (type === "clear-all") {
          onObjectCheckedChanged([]);
        }
      }
    },
    [checkedObjects, checkedRows, onObjectCheckedChanged, searchData],
  );

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
      checkedRows,
      onRowCheckChange,
      batchCheckRows,
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

  const getObjectProperty = (
    obj: ParsedSkylarkObject,
    property: string,
    rowIndex: number,
  ) => {
    if (property === OBJECT_LIST_TABLE.columnIds.displayField) {
      return rowIndex;
    }
    return hasProperty(obj.metadata, property)
      ? `${obj.metadata[property]}`
      : "";
  };

  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: formattedSearchData?.length ? formattedSearchData.length + 1 : 0,
    estimateSize: useCallback(() => 42, []),
    // overscan: 10,
  });

  const columnVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: parsedColumns.length,
    estimateSize: useCallback(() => 200, []),
    // overscan: 10,
    horizontal: true,
  });

  const { virtualItems: virtualRows, totalSize: totalRows } = rowVirtualizer;
  const { virtualItems: virtualColumns, totalSize: totalColumns } =
    columnVirtualizer;

  const headers = table.getHeaderGroups()[0].headers;

  const { rows } = table.getRowModel();

  // return (
  //   <div
  //     className={clsx(
  //       "scrollbar-hidden relative mb-6 flex w-auto flex-col overflow-x-auto overscroll-none md:-ml-4 ",
  //     )}
  //     ref={tableContainerRef}
  //     data-testid="object-search-results"
  //     id="object-search-results"
  //     onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
  //   >
  //     <Table
  //       table={table}
  //       virtualRows={virtualRows}
  //       totalRows={totalRows}
  //       withCheckbox={withObjectSelect}
  //       isLoadingMore={hasNextPage}
  //       activeObject={panelObject || undefined}
  //       withDraggableRow={!!panelObject}
  //     />
  //   </div>
  // );
  return (
    <div
      ref={tableContainerRef}
      className="scrollbar-hidden relative mb-6 flex w-auto flex-col overflow-x-auto overscroll-none border-red-500 text-sm md:-ml-4"
      // style={{
      //   height: `400px`,
      //   width: `500px`,
      //   overflow: "auto",
      // }}
    >
      <div
        style={{
          height: rowVirtualizer.totalSize,
          width: columnVirtualizer.totalSize,
          position: "relative",
        }}
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => (
          <Fragment key={virtualRow.key}>
            {columnVirtualizer.virtualItems.map((virtualColumn) => {
              const column = table.getAllColumns()[virtualColumn.index];
              return (
                <div
                  key={virtualColumn.key}
                  ref={(el) => {
                    virtualRow.measureRef(el);
                    virtualColumn.measureRef(el);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    style={{
                      height: virtualRow.size,
                      width: column.getSize(),
                      // height: 100,
                      // width: 100,
                    }}
                    className="overflow-hidden px-2"
                  >
                    {virtualRow.index === 0
                      ? flexRender(
                          headers[virtualColumn.index].column.columnDef.header,
                          headers[virtualColumn.index].getContext(),
                        )
                      : getObjectProperty(
                          (
                            rows[
                              virtualRow.index - 1
                            ] as Row<ParsedSkylarkObject>
                          ).original,
                          (
                            rows[
                              virtualRow.index - 1
                            ] as Row<ParsedSkylarkObject>
                          ).getVisibleCells()[virtualColumn.index].column.id,
                          virtualRow.index,
                        )}
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

const ObjectSearchResultsPropsAreEqual = (
  prevProps: Readonly<ObjectSearchResultsProps>,
  nextProps: Readonly<ObjectSearchResultsProps>,
) => {
  const isShallowSame = shallowCompareObjects(prevProps, nextProps);
  return isShallowSame;
};

export const MemoizedObjectSearchResults = memo(
  ObjectSearchResults,
  ObjectSearchResultsPropsAreEqual,
);
