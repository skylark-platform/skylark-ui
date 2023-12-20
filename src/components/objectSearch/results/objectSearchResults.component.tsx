import { CheckedState } from "@radix-ui/react-checkbox";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  Header,
  TableState,
  Updater,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useRef, useState, useMemo, useCallback, memo } from "react";
import { VirtualItem, defaultRangeExtractor, useVirtual } from "react-virtual";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { CheckedObjectState, PanelTab } from "src/hooks/state";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { useDndMonitor } from "src/lib/dndkit/dndkit";
import {
  getObjectDisplayName,
  hasProperty,
  shallowCompareObjects,
  skylarkObjectsAreSame,
} from "src/lib/utils";

import {
  OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
  ObjectSearchTableData,
} from "./columnConfiguration";
import {
  ObjectSearchResultGridDivider,
  ObjectSearchResultsLeftGrid,
  ObjectSearchResultsRightGrid,
} from "./grids";

export interface ObjectSearchResultsProps {
  tableId: string;
  tableColumns: ColumnDef<ObjectSearchTableData, ObjectSearchTableData>[];
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  setPanelObject?: (obj: SkylarkObjectIdentifier, tab?: PanelTab) => void;
  fetchNextPage?: () => void;
  searchData?: ObjectSearchTableData[];
  hasNextPage?: boolean;
  isSearching?: boolean;
  isFetchingNextPage?: boolean;
  tableState: TableState;
  checkedObjectsState?: CheckedObjectState[];
  setTableState: (updater: Updater<TableState>) => void;
  onObjectCheckedChanged?: (s: CheckedObjectState[]) => void;
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
  tableId,
  tableColumns,
  tableState,
  panelObject,
  setPanelObject,
  searchData,
  withObjectSelect,
  hasNextPage,
  isSearching,
  fetchNextPage,
  checkedObjectsState,
  isFetchingNextPage,
  onObjectCheckedChanged,
  setTableState,
}: ObjectSearchResultsProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { objects: objectsMeta } = useAllObjectsMeta(true);

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

  // TODO enable this? Leaving this here to see if we're actually affect by the problem
  // a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  // useEffect(() => {
  //   fetchMoreOnBottomReached(tableContainerRef.current);
  // }, [fetchMoreOnBottomReached]);

  const onRowCheckChange = useCallback(
    (updated: { object: ParsedSkylarkObject; checkedState: CheckedState }) => {
      if (onObjectCheckedChanged && checkedObjectsState) {
        const existsIndex = checkedObjectsState.findIndex((c) =>
          skylarkObjectsAreSame(updated.object, c.object),
        );

        if (existsIndex > -1) {
          const copyArr = [...checkedObjectsState];
          copyArr[existsIndex] = updated;
          onObjectCheckedChanged(copyArr);
        } else {
          onObjectCheckedChanged([...checkedObjectsState, updated]);
        }
      }
    },
    [checkedObjectsState, onObjectCheckedChanged],
  );

  const rowCheckedState: Record<string, boolean> =
    withObjectSelect && checkedObjectsState && searchData
      ? checkedObjectsState.reduce(
          (acc, { object: checkedObj, checkedState }) => {
            const index = searchData.findIndex((searchDataObj) =>
              skylarkObjectsAreSame(checkedObj, searchDataObj),
            );

            if (index > -1) {
              return {
                ...acc,
                [index]: Boolean(checkedState),
              };
            }
            return acc;
          },
          {},
        )
      : {};

  const batchCheckRows = useCallback(
    (type: "shift" | "clear-all", rowIndex?: number) => {
      if (onObjectCheckedChanged) {
        if (
          type === "shift" &&
          rowIndex !== undefined &&
          checkedObjectsState &&
          searchData
        ) {
          const checkedRows = checkedObjectsState
            .filter(({ checkedState }) => checkedState !== false)
            .map(({ object }) => {
              const index = searchData.findIndex((searchDataObj) =>
                skylarkObjectsAreSame(object, searchDataObj),
              );

              return index;
            })
            .filter((index) => index > -1);

          // We want to find the last checked row before the given index
          const reverseSortedCheckedRows = checkedRows.sort((a, b) => b - a);
          const firstSmallerIndex = reverseSortedCheckedRows.findIndex(
            (val) => val < rowIndex,
          );

          // Once found, we check all boxes after the previous row until and including the given index
          const objectsToCheck = searchData
            .slice(
              reverseSortedCheckedRows[firstSmallerIndex] + 1 || 0,
              rowIndex + 1,
            )
            .map((object) => ({ object, checkedState: true }));

          onObjectCheckedChanged([...checkedObjectsState, ...objectsToCheck]);
        }

        if (type === "clear-all") {
          onObjectCheckedChanged([]);
        }
      }
    },
    [checkedObjectsState, onObjectCheckedChanged, searchData],
  );

  // TODO we may want to refactor this so that hovering doesn't trigger a render
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Disable Table Overflow, hover events - used when dragging
  const [disableTableEvents, setDisableTableEvents] = useState<{
    overflow: boolean;
    hover: boolean;
  } | null>(null);

  const frozenColumns = useMemo(
    () => tableState.columnPinning.left || [],
    [tableState.columnPinning.left],
  );

  const showObjectTypeIndicator =
    !tableState.columnVisibility[OBJECT_LIST_TABLE.columnIds.objectType] ||
    frozenColumns.indexOf(OBJECT_LIST_TABLE.columnIds.objectTypeIndicator) +
      1 !==
      frozenColumns.indexOf(OBJECT_LIST_TABLE.columnIds.objectType);

  const table = useReactTable<ObjectSearchTableData>({
    debugAll: false,
    data: (formattedSearchData as ObjectSearchTableData[]) || emptyArray,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    enableRowSelection: true,
    state: {
      ...tableState,
      columnVisibility: {
        ...tableState.columnVisibility,
        [OBJECT_LIST_TABLE.columnIds.objectTypeIndicator]:
          showObjectTypeIndicator,
      },
      rowSelection: rowCheckedState,
    },
    onStateChange: setTableState,
    meta: {
      activeObject: panelObject || null,
      checkedObjectsState: checkedObjectsState,
      objectTypesWithConfig,
      objectsMeta,
      onRowCheckChange,
      batchCheckRows,
      onObjectClick: setPanelObject,
      hoveredRow,
      disableTableEvents,
    },
  });

  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: formattedSearchData?.length ? formattedSearchData.length : 0,
    estimateSize: useCallback(() => 42, []),
    paddingStart: 32, // Padding to handle the sticky headers, same as estimateSize
    rangeExtractor: (range) => {
      const rangeAsSet = new Set([0, ...defaultRangeExtractor(range)]);
      return [...rangeAsSet];
    },
  });

  const visibleColumns = table.getVisibleLeafColumns();

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
    ObjectSearchTableData,
    string
  >[];

  const columnVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: headers.length,
    estimateSize: useCallback(() => 200, []),
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

  const onDragEnd = () => {
    if (disableTableEvents) setDisableTableEvents(null);
    if (showFrozenColumnDropZones) setShowFrozenColumnDropZones(false);
  };

  useDndMonitor({
    onDragStart(event) {
      const type = event.active.data.current.type;

      if (type === "OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS") {
        setShowFrozenColumnDropZones(true);
        setDisableTableEvents({
          hover: true,
          overflow: false,
        });
        tableContainerRef.current?.scrollTo({ left: 0, behavior: "instant" });
      } else if (type === "CONTENT_LIBRARY_OBJECT") {
        setDisableTableEvents({
          overflow: true,
          hover: true,
        });
      }
    },
    onDragEnd(event) {
      if (
        event.active.data.current.type === "OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS"
      ) {
        const dropzoneColumnId = event.over?.data.current?.columnId;
        if (dropzoneColumnId) {
          // When the frozen columns are changed, unfreeze any hidden columns and move to the right of the frozen columns
          const orderedVisibleColumns = [...visibleColumns];

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

          // Move newly unfrozen columns to the right
          const columnsToBeUnfrozen = frozenColumns.filter(
            (col) => !updatedFrozenColumns.includes(col),
          );

          if (columnsToBeUnfrozen.length > 0) {
            const unfrozenColumns = tableState.columnOrder.filter(
              (col) => !updatedFrozenColumns.includes(col),
            );

            const updatedColumnOrder = [
              ...updatedFrozenColumns,
              ...unfrozenColumns,
            ];

            setTableState((prev) => ({
              ...prev,
              columnOrder: updatedColumnOrder,
              columnPinning: {
                left: updatedFrozenColumns,
              },
            }));
          } else {
            setTableState((prev) => ({
              ...prev,
              columnPinning: {
                left: updatedFrozenColumns,
              },
            }));
          }
        }
      }

      onDragEnd();
    },
    onDragCancel: onDragEnd,
  });

  return (
    <>
      <div
        ref={tableContainerRef}
        className={clsx(
          "relative min-h-full overscroll-contain text-sm",
          !formattedSearchData ||
            formattedSearchData.length === 0 ||
            disableTableEvents?.overflow
            ? "overflow-hidden"
            : "overflow-auto",
        )}
        onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
        onMouseLeave={() => setHoveredRow(null)}
        data-testid="object-search-results"
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
                tableId={tableId}
                virtualColumns={virtualColumns.left}
                virtualRows={rowVirtualizer.virtualItems}
                headers={headers}
                leftGridSize={leftGridTotalSize}
                rows={rows}
                hasScrolledRight={hasScrolledRight}
                panelObject={panelObject || null}
                hoveredRow={hoveredRow}
                setHoveredRow={
                  !disableTableEvents?.hover ? setHoveredRow : undefined
                }
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
              tableId={tableId}
              leftGridSize={leftGridTotalSize}
              totalVirtualSizes={totalVirtualSizes}
            />
            {virtualColumns.right.length > 0 && (
              <ObjectSearchResultsRightGrid
                table={table}
                tableId={tableId}
                totalVirtualSizes={totalVirtualSizes}
                hasScrolledRight={hasScrolledRight}
                virtualColumns={virtualColumns.right}
                virtualRows={rowVirtualizer.virtualItems}
                headers={headers}
                rows={rows}
                leftGridSize={leftGridTotalSize}
                panelObject={panelObject || null}
                hoveredRow={hoveredRow}
                setHoveredRow={
                  !disableTableEvents?.hover ? setHoveredRow : undefined
                }
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

        {!isSearching &&
          formattedSearchData &&
          formattedSearchData.length === 0 && (
            <>
              <p className="absolute left-2 right-5 top-14 text-manatee-600 md:left-8">{`We couldn't find matches for the search term.`}</p>
              <p className="absolute left-2 right-5 top-20 text-manatee-600 md:left-8">{`Try changing the lookup type or adjusting search filters for better results.`}</p>
            </>
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

// export const MemoizedObjectSearchResults = memo(
//   ObjectSearchResults,
//   ObjectSearchResultsPropsAreEqual,
// );

export const MemoizedObjectSearchResults = ObjectSearchResults;
