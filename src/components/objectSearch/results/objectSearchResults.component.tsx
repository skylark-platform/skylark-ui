import { CheckedState } from "@radix-ui/react-checkbox";
import {
  VisibilityState,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  Row,
  Header,
  ColumnOrderState,
  OnChangeFn,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useRef, useState, useMemo, useCallback, memo } from "react";
import { VirtualItem, defaultRangeExtractor, useVirtual } from "react-virtual";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { PanelTab } from "src/hooks/state";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { DragStartEvent, useDndMonitor } from "src/lib/dndkit/dndkit";
import {
  getObjectDisplayName,
  hasProperty,
  shallowCompareObjects,
  skylarkObjectsAreSame,
} from "src/lib/utils";

import { OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS } from "./columnConfiguration";
import {
  ObjectSearchResultGridDivider,
  ObjectSearchResultsLeftGrid,
  ObjectSearchResultsRightGrid,
} from "./grids";

export interface ObjectSearchResultsProps {
  tableColumns: ColumnDef<ParsedSkylarkObject, ParsedSkylarkObject>[];
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  setPanelObject?: (obj: SkylarkObjectIdentifier, tab?: PanelTab) => void;
  fetchNextPage?: () => void;
  searchData?: ParsedSkylarkObject[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  frozenColumns: string[];
  checkedObjects?: ParsedSkylarkObject[];
  setColumnVisibility: OnChangeFn<VisibilityState>;
  setColumnOrder: OnChangeFn<ColumnOrderState>;
  setFrozenColumns: (cols: string[]) => void;
  onObjectCheckedChanged?: (o: ParsedSkylarkObject[]) => void;
}

// https://github.com/TanStack/table/issues/4240
const emptyArray = [] as object[];

const splitVirtualColumns = (
  virtualItems: VirtualItem[],
  leftIndexes: number[],
) => {
  const leftVirtualColumns = virtualItems
    .filter((virtualCol) => leftIndexes.includes(virtualCol.index))
    .sort((colA, colB) => colA.index - colB.index);

  const rightVirtualColumns = virtualItems.filter(
    (virtualCol) => !leftIndexes.includes(virtualCol.index),
  );

  return {
    left: leftVirtualColumns,
    right: rightVirtualColumns,
  };
};

export const ObjectSearchResults = ({
  tableColumns,
  columnVisibility,
  columnOrder,
  frozenColumns,
  panelObject,
  setPanelObject,
  searchData,
  withObjectSelect,
  hasNextPage,
  fetchNextPage,
  checkedObjects,
  isFetchingNextPage,
  onObjectCheckedChanged,
  setColumnVisibility,
  setColumnOrder,
  setFrozenColumns,
}: ObjectSearchResultsProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

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

  // TODO we may want to refactor this so that hovering doesn't trigger a render
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const showObjectTypeIndicator =
    !columnVisibility[OBJECT_LIST_TABLE.columnIds.objectType] ||
    frozenColumns.indexOf(OBJECT_LIST_TABLE.columnIds.objectTypeIndicator) +
      1 !==
      frozenColumns.indexOf(OBJECT_LIST_TABLE.columnIds.objectType);

  const table = useReactTable<ParsedSkylarkObject>({
    debugAll: false,
    data: (formattedSearchData as ParsedSkylarkObject[]) || emptyArray,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    state: {
      columnVisibility: {
        ...columnVisibility,
        [OBJECT_LIST_TABLE.columnIds.objectTypeIndicator]:
          showObjectTypeIndicator,
      },
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      activeObject: panelObject || null,
      checkedRows,
      objectTypesWithConfig,
      onRowCheckChange,
      batchCheckRows,
      onObjectClick: setPanelObject,
      hoveredRow,
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

  const visibleColumns = table
    .getVisibleFlatColumns()
    .sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id));

  const frozenColumnsParsedColumnsIndexes = useMemo(
    () =>
      frozenColumns
        .map((col) =>
          visibleColumns.findIndex(
            (header) =>
              header.id === col ||
              (hasProperty(header, "accessorKey") &&
                header.accessorKey === col),
          ),
        )
        .filter((num) => num > -1),
    [frozenColumns, visibleColumns],
  );

  const headers = table.getHeaderGroups()[0].headers as Header<
    ParsedSkylarkObject,
    string
  >[];

  const columnVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: headers.length,
    estimateSize: useCallback(() => 200, []),
    // overscan: 10,
    horizontal: true,
    rangeExtractor: (range) => {
      const rangeAsSet = new Set([
        ...frozenColumnsParsedColumnsIndexes,
        ...defaultRangeExtractor(range),
      ]);
      return [...rangeAsSet];
    },
  });

  const virtualColumns = useMemo(
    () =>
      splitVirtualColumns(
        columnVirtualizer.virtualItems,
        frozenColumnsParsedColumnsIndexes,
      ),
    [columnVirtualizer.virtualItems, frozenColumnsParsedColumnsIndexes],
  );

  const { rows } = table.getRowModel();

  const leftGridTotalSize = visibleColumns
    .filter((col) => frozenColumns.includes(col.id))
    .reduce((total, col) => total + col.getSize(), 0);

  const hasScrolledRight =
    (tableContainerRef?.current && tableContainerRef.current.scrollLeft > 5) ||
    false;

  const totalVirtualSizes = {
    height: rowVirtualizer.totalSize,
    width: columnVirtualizer.totalSize,
  };

  const [showFrozenColumnDropZones, setShowFrozenColumnDropZones] =
    useState(false);

  useDndMonitor({
    onDragStart(event: DragStartEvent) {
      if (
        event.active.data.current.type === "OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS"
      ) {
        setShowFrozenColumnDropZones(true);
      }
      console.log({ event });
    },
    onDragEnd(event) {
      if (
        event.active.data.current.type === "OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS"
      ) {
        const dropzoneColumnId = event.over?.data.current?.columnId;
        if (dropzoneColumnId) {
          const orderedVisibleColumns = [...visibleColumns].sort(
            (a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id),
          );

          const columnIndex = orderedVisibleColumns.findIndex(
            (col) => col.id === dropzoneColumnId,
          );

          const updatedFrozenColumns = [
            ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
            ...orderedVisibleColumns
              .slice(0, columnIndex + 1)
              .map(({ id }) => id)
              .filter(
                (col) => !OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS.includes(col),
              ),
          ];

          // Need to make it so at the time of switching, if there are hidden columns in between the frozen and target, the visible targets are moved to the left of the hidden columns

          setFrozenColumns(updatedFrozenColumns);
        }
      }

      setShowFrozenColumnDropZones(false);
    },
    onDragCancel() {
      setShowFrozenColumnDropZones(false);
    },
  });

  return (
    <>
      <div
        ref={tableContainerRef}
        className={clsx(
          "relative min-h-full overscroll-contain text-sm",
          formattedSearchData && formattedSearchData.length > 0
            ? "overflow-auto"
            : "overflow-hidden",
        )}
        onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        {headers && (
          <div
            style={totalVirtualSizes}
            className="relative flex min-h-full"
            data-testid="object-search-results-content"
          >
            {virtualColumns.left.length > 0 && (
              <ObjectSearchResultsLeftGrid
                table={table}
                virtualColumns={virtualColumns.left}
                virtualRows={rowVirtualizer.virtualItems}
                headers={headers}
                leftGridSize={leftGridTotalSize}
                rows={rows as Row<ParsedSkylarkObject>[]}
                hasScrolledRight={hasScrolledRight}
                panelObject={panelObject || null}
                hoveredRow={hoveredRow}
                setHoveredRow={setHoveredRow}
                totalVirtualSizes={totalVirtualSizes}
                showFrozenColumnDropZones={showFrozenColumnDropZones}
                numberFrozenColumns={
                  frozenColumns.length -
                  OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS.length
                }
                showSkeletonRows={hasNextPage || isFetchingNextPage || false}
              />
            )}
            <ObjectSearchResultGridDivider
              leftGridSize={leftGridTotalSize}
              totalVirtualSizes={totalVirtualSizes}
            />
            {virtualColumns.right.length > 0 && (
              <ObjectSearchResultsRightGrid
                table={table}
                totalVirtualSizes={totalVirtualSizes}
                hasScrolledRight={hasScrolledRight}
                virtualColumns={virtualColumns.right}
                virtualRows={rowVirtualizer.virtualItems}
                headers={headers}
                rows={rows as Row<ParsedSkylarkObject>[]}
                leftGridSize={leftGridTotalSize}
                panelObject={panelObject || null}
                hoveredRow={hoveredRow}
                setHoveredRow={setHoveredRow}
                showFrozenColumnDropZones={showFrozenColumnDropZones}
                numberFrozenColumns={
                  frozenColumns.length -
                  OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS.length
                }
                showSkeletonRows={hasNextPage || isFetchingNextPage || false}
              />
            )}
          </div>
        )}

        {formattedSearchData && formattedSearchData.length === 0 && (
          <p className="absolute left-2 right-5 top-14 text-manatee-600 md:left-8">{`No results containing all your search terms were found.`}</p>
        )}
      </div>
    </>
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
