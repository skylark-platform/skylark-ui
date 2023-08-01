import { CheckedState } from "@radix-ui/react-checkbox";
import {
  VisibilityState,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  Row,
  Column,
  Header,
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
import { VirtualItem, defaultRangeExtractor, useVirtual } from "react-virtual";

import { Checkbox } from "src/components/inputs/checkbox";
import { ObjectTypePill } from "src/components/pill";
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
  // useEffect(() => {
  //   fetchMoreOnBottomReached(tableContainerRef.current);
  // }, [fetchMoreOnBottomReached]);

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

  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: formattedSearchData?.length ? formattedSearchData.length : 0,
    estimateSize: useCallback(() => 42, []),
    // overscan: 10,
    paddingStart: 42, // Padding to handle the sticky headers, same as estimateSize
    rangeExtractor: (range) => {
      const rangeAsSet = new Set([0, ...defaultRangeExtractor(range)]);
      return [...rangeAsSet];
    },
  });

  const columnVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: parsedColumns.length,
    estimateSize: useCallback(() => 200, []),
    // overscan: 10,
    horizontal: true,
    rangeExtractor: (range) => {
      const rangeAsSet = new Set([0, 1, ...defaultRangeExtractor(range)]);
      return [...rangeAsSet];
    },
  });

  const { virtualItems: virtualRows, totalSize: totalRows } = rowVirtualizer;
  const { virtualItems: virtualColumns, totalSize: totalColumns } =
    columnVirtualizer;

  const headers = table.getHeaderGroups()[0].headers;

  const { rows } = table.getRowModel();
  const columns = table.getAllColumns();

  console.log({
    x: tableContainerRef.current?.scrollLeft,
    rows,
    rowSize: formattedSearchData?.length,
    formattedSearchData,
    columns,
    headers,
    headersSlice: headers.slice(1),
  });

  const hasScrolledRight =
    (tableContainerRef?.current && tableContainerRef.current.scrollLeft > 5) ||
    false;

  return (
    <>
      <div ref={tableContainerRef} className="relative overflow-auto text-sm">
        {headers && (
          <div
            style={{
              height: rowVirtualizer.totalSize,
              width: columnVirtualizer.totalSize,
            }}
            className="relative flex"
          >
            <LeftGrid
              virtualColumns={columnVirtualizer.virtualItems.slice(0, 2)}
              virtualRows={rowVirtualizer.virtualItems}
              headers={headers}
              width={columns[0].getSize() + columns[1].getSize()}
              rows={rows as Row<ParsedSkylarkObject>[]}
              showShadow={hasScrolledRight}
            />
            <RightGrid
              virtualColumns={columnVirtualizer.virtualItems.slice(2)}
              virtualRows={rowVirtualizer.virtualItems}
              headers={headers}
              leftGridSize={columns[0].getSize() + columns[1].getSize()}
            />
          </div>
        )}
      </div>
    </>
  );
};

const LeftGrid = ({
  virtualRows,
  width,
  rows,
  showShadow,
  virtualColumns,
  headers,
}: {
  virtualRows: VirtualItem[];
  width: number;
  rows: Row<ParsedSkylarkObject>[];
  showShadow: boolean;
  virtualColumns: VirtualItem[];
  headers: Header<object, string>[];
}) => {
  return (
    <div
      className="sticky left-0 z-[5] h-full transition-shadow"
      style={{
        width,
        boxShadow: showShadow ? "2px 0px 5px 0px #888" : undefined,
      }}
    >
      <div
        style={{
          height: virtualRows[0].size,
        }}
        className="sticky top-0 z-[4] w-full"
      >
        {virtualColumns.map((virtualColumn) => {
          const header = headers[virtualColumn.index];
          return (
            <HeaderCell
              key={`left-grid-header-${header.id}`}
              header={header}
              height={virtualRows[0].size}
              virtualColumn={virtualColumn}
            />
          );
        })}
      </div>
      {virtualRows.map((virtualRow) => (
        <Fragment key={`left-grid-row-${virtualRow.index}`}>
          {virtualColumns.map((virtualColumn) => {
            const row = rows[virtualRow.index];
            const cell = row ? row.getAllCells()[virtualColumn.index] : null;

            return (
              <div
                key={`left-grid-column-${virtualColumn.index}`}
                className="absolute left-0 flex items-center gap-2 bg-white"
                style={{
                  width: virtualColumn.size,
                  height: virtualRow.size,
                  transform: `translateX(${virtualColumn.start}px) translateY(${
                    virtualRow.start - virtualRows[0].size
                  }px)`,
                }}
              >
                {/* {`Row ${virtualRow.index}`} */}
                {cell &&
                cell.column.id === OBJECT_LIST_TABLE.columnIds.displayField ? (
                  <>
                    <div className="w-4 min-w-4 max-w-4">
                      {virtualRow.index}
                    </div>
                    {/* <Checkbox />
                    <ObjectTypePill
                      type={row.original.objectType}
                      className="w-20 min-w-20"
                    /> */}
                    <div>
                      {cell
                        ? flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        : ""}
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
};

const RightGrid = ({
  virtualRows,
  virtualColumns,
  headers,
  leftGridSize,
}: {
  virtualRows: VirtualItem[];
  virtualColumns: VirtualItem[];
  headers: Header<object, string>[];
  leftGridSize: number;
}) => {
  console.log("RightGrid", { headers, virtualColumns });
  return (
    <div className="relative">
      <div
        style={{
          height: virtualRows[0].size,
        }}
        className="sticky top-0 z-[1] w-full"
      >
        {virtualColumns.map((virtualColumn) => {
          const header = headers[virtualColumn.index];
          return (
            <HeaderCell
              key={`right-grid-header-${header.id}`}
              header={header}
              height={virtualRows[0].size}
              virtualColumn={virtualColumn}
              paddingLeft={leftGridSize}
            />
          );
        })}
      </div>

      {virtualRows.map((virtualRow) => (
        <Fragment key={`right-grid-row-${virtualRow.index}`}>
          {virtualColumns.map((virtualColumn) => (
            <div
              key={`right-grid-col-${virtualColumn.index}`}
              ref={(el) => {
                virtualColumn.measureRef(el);
              }}
              className="absolute left-0 top-0 flex items-center justify-start px-2"
              style={{
                transform: `translateX(${
                  virtualColumn.start - leftGridSize
                }px) translateY(${virtualRow.start}px)`,
                width: `${virtualColumn.size}px`,
                height: `${virtualRow.size}px`,
              }}
            >
              {`Cell ${virtualRow.index}, ${virtualColumn.index}`}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
};

const HeaderCell = ({
  header,
  height,
  virtualColumn,
  paddingLeft = 0,
}: {
  header: Header<object, string>;
  height: number;
  virtualColumn: VirtualItem;
  paddingLeft?: number;
}) => {
  return (
    <div
      className="absolute left-0 top-0 flex select-none items-center bg-white px-2 font-medium "
      style={{
        width: header.getSize(),
        height,
        transform: `translateX(${
          virtualColumn.start - paddingLeft
        }px) translateY(0px)`,
      }}
      ref={(el) => {
        virtualColumn.measureRef(el);
      }}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      <div
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        className="absolute right-0 z-[1] mr-1 h-4 w-0.5 cursor-col-resize bg-manatee-200"
      />
    </div>
  );

  // <div
  //   key={virtualColumn.index}
  //   className="absolute left-0 top-0 z-[4] flex select-none items-center bg-white px-2 font-medium"
  //   style={{
  //     // position: virtualColumn.index === 0 ? "sticky" : "absolute",
  //     // zIndex: virtualColumn.index === 0 ? 1 : undefined,
  //     width: header.getSize(),
  //     height: virtualRows[0].size,
  //     transform: `translateX(${virtualColumn.start}px) translateY(0px)`,
  //   }}
  //   ref={(el) => {
  //     virtualColumn.measureRef(el);
  //   }}
  // >
  //   {flexRender(header.column.columnDef.header, header.getContext())}
  //   <div
  //     onMouseDown={header.getResizeHandler()}
  //     onTouchStart={header.getResizeHandler()}
  //     className="absolute right-0 z-10 mr-1 h-4 w-0.5 cursor-col-resize bg-manatee-200"
  //   />
  // </div>;
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
