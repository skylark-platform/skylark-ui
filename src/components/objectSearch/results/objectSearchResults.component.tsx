import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
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
  ColumnOrderState,
  Table,
  OnChangeFn,
} from "@tanstack/react-table";
import clsx from "clsx";
import {
  useRef,
  useState,
  useMemo,
  useCallback,
  memo,
  Fragment,
  CSSProperties,
} from "react";
import { VirtualItem, defaultRangeExtractor, useVirtual } from "react-virtual";

import { RowActions } from "src/components/objectSearch/rowActions";
import { Skeleton } from "src/components/skeleton";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { PanelTab } from "src/hooks/state";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import {
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  useDndMonitor,
} from "src/lib/dndkit/dndkit";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import {
  getObjectDisplayName,
  hasProperty,
  shallowCompareObjects,
  skylarkObjectsAreSame,
} from "src/lib/utils";

import { OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS } from "./columnConfiguration";

const MAX_FROZEN_COLUMNS = 4;

const columnsWithoutResize = [
  OBJECT_LIST_TABLE.columnIds.dragIcon,
  OBJECT_LIST_TABLE.columnIds.checkbox,
  OBJECT_LIST_TABLE.columnIds.objectTypeIndicator,
];

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

const headAndDataClassNames =
  "overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm text-base-content";

// https://github.com/TanStack/table/issues/4240
const emptyArray = [] as object[];

const reorderColumn = (
  draggedColumnId: string,
  targetColumnId: string,
  columnOrder: string[],
): ColumnOrderState => {
  columnOrder.splice(
    columnOrder.indexOf(targetColumnId),
    0,
    columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string,
  );
  return [...columnOrder];
};

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
              <LeftGrid
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
            <GridDivider
              leftGridSize={leftGridTotalSize}
              totalVirtualSizes={totalVirtualSizes}
            />
            {virtualColumns.right.length > 0 && (
              <RightGrid
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

interface GridProps {
  table: Table<ParsedSkylarkObject>;
  totalVirtualSizes: { height: number; width: number };
  rows: Row<ParsedSkylarkObject>[];
  virtualRows: VirtualItem[];
  virtualColumns: VirtualItem[];
  headers: Header<ParsedSkylarkObject, string>[];
  leftGridSize: number;
  panelObject: SkylarkObjectIdentifier | null;
  hoveredRow: number | null;
  setHoveredRow: (rowId: number | null) => void;
  showFrozenColumnDropZones: boolean;
  numberFrozenColumns: number;
  hasScrolledRight: boolean;
  showSkeletonRows: boolean;
}

const LeftGrid = ({
  table,
  totalVirtualSizes,
  virtualRows,
  leftGridSize: width,
  rows,
  hasScrolledRight: showShadow,
  virtualColumns,
  headers,
  panelObject,
  hoveredRow,
  showFrozenColumnDropZones,
  showSkeletonRows,
  setHoveredRow,
}: GridProps) => {
  const visiblePermanentFrozenColumns = headers.filter((header) =>
    OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS.includes(header.id),
  );

  // Drop area should show on Display name field and all others apart from the last frozen one
  const unfreezableVirtualColumns = virtualColumns.slice(
    visiblePermanentFrozenColumns.length,
    virtualColumns.length - 1,
  );

  const unfreezeAllDropzone =
    visiblePermanentFrozenColumns[visiblePermanentFrozenColumns.length - 1];
  const unfreezeAllDropzoneWidth = visiblePermanentFrozenColumns.reduce(
    (total, header) => total + header.getSize(),
    0,
  );

  return (
    <div
      className={clsx(
        "left-0 z-[5] h-full transition-shadow md:sticky",
        showShadow && "md:shadow-object-search-divider",
      )}
      style={{
        width,
      }}
    >
      {showFrozenColumnDropZones && (
        <FrozenColumnDropzone
          columnId={unfreezeAllDropzone.id}
          height={totalVirtualSizes.height}
          leftGridSize={0}
          width={unfreezeAllDropzoneWidth}
          virtualColumn={virtualColumns[0]}
        />
      )}
      <FrozenColumnDropzones
        show={showFrozenColumnDropZones}
        dropzoneColumns={unfreezableVirtualColumns}
        leftGridSize={0}
        height={totalVirtualSizes.height}
        headers={headers}
      />
      {virtualColumns.length > 0 && width >= 110 && hoveredRow !== null && (
        <RowActions
          onInfoClick={
            table.options.meta?.onObjectClick
              ? (obj) =>
                  table.options.meta?.onObjectClick?.(
                    convertParsedObjectToIdentifier(obj),
                  )
              : undefined
          }
          activeRowIndex={hoveredRow}
          virtualColumns={virtualColumns}
          rows={rows}
          virtualRows={virtualRows}
        />
      )}
      <div
        style={{
          height: virtualRows[0].size,
        }}
        className="sticky top-0 z-[6] w-full"
      >
        {virtualColumns.map((virtualColumn) => {
          const header = headers[virtualColumn.index];
          return (
            <HeaderCell
              key={`left-grid-header-${header.id}`}
              header={header}
              virtualColumn={virtualColumn}
              onMouseEnter={() => setHoveredRow(null)}
            />
          );
        })}
      </div>
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        const key = `left-grid-row-${virtualRow.index}`;

        if (!row) {
          return <Fragment key={key} />;
        }

        return (
          <LayoutRow
            key={key}
            row={row}
            virtualRow={virtualRow}
            virtualColumns={virtualColumns}
            panelObject={panelObject}
            hoveredRow={hoveredRow}
            isLeft
            setHoveredRow={setHoveredRow}
          />
        );
      })}
      {showSkeletonRows && (
        <GridSkeleton
          virtualColumns={virtualColumns}
          virtualRows={virtualRows}
          headers={headers}
          totalVirtualSizes={totalVirtualSizes}
          paddingLeft={0}
          className="bg-white"
        />
      )}
    </div>
  );
};

const GridSkeleton = ({
  virtualRows,
  virtualColumns,
  totalVirtualSizes,
  headers,
  paddingLeft,
  className,
}: {
  virtualRows: VirtualItem[];
  virtualColumns: VirtualItem[];
  totalVirtualSizes: { height: number; width: number };
  headers: Header<ParsedSkylarkObject, string>[];
  paddingLeft: number;
  className?: string;
}) => {
  const lastVirtualRow = virtualRows[virtualRows.length - 1];
  return (
    <div
      className={clsx("absolute", className)}
      style={{
        left: virtualColumns[0].start - paddingLeft,
        top: totalVirtualSizes.height,
      }}
    >
      {[...Array(15)].map((e, i) => {
        return (
          <div key={`skeleton-row-${i}`} className="relative flex h-10">
            {virtualColumns.map((virtualColumn) => {
              const columnId = headers[virtualColumn.index]?.id;
              return (
                <div
                  key={`skeleton-row-${i}-column-${virtualColumn.index}`}
                  style={{
                    width: virtualColumn.size,
                    height: lastVirtualRow.size,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-start">
                    <Skeleton
                      className={clsx(
                        "h-5",
                        columnId === OBJECT_LIST_TABLE.columnIds.dragIcon &&
                          "hidden",
                        columnId === OBJECT_LIST_TABLE.columnIds.checkbox
                          ? "w-5"
                          : "ml-1 w-[90%]",
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const GridDivider = ({
  leftGridSize,
  totalVirtualSizes,
}: {
  leftGridSize: number;
  totalVirtualSizes: { height: number; width: number };
}) => {
  const [mousePosition, setMousePosition] = useState(0);
  const [dragDelta, setDragDelta] = useState<{
    initial: number;
    current: number;
  } | null>(null);

  const dragPositionDifference = dragDelta
    ? dragDelta.current - dragDelta.initial
    : 0;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      type: "OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS",
      id: "MODIFY_FROZEN_COLUMNS",
    });

  const style: CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, 0px, 0)`,
        left: 0,
        display: "block",
        zIndex: 6,
      }
    : undefined;

  useDndMonitor({
    onDragMove(event) {
      setDragDelta((previousValue) =>
        previousValue === null
          ? {
              initial: event.delta.y,
              current: event.delta.y,
            }
          : { ...previousValue, current: event.delta.y },
      );
    },
  });

  return (
    <div
      // The mt- needs to match the -top- in the element below
      className={clsx(
        "group/grid-divider sticky right-0 z-[5] -ml-4 mt-10 hidden w-3 md:block",
        isDragging && "cursor-grabbing",
      )}
      style={{
        left: leftGridSize - 5,
        height: totalVirtualSizes.height,
        ...style,
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        setMousePosition(y);
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div
        className={clsx(
          "absolute -top-10 bottom-0 left-1 h-full w-px rounded-full bg-manatee-200",
          isDragging
            ? "block cursor-grabbing"
            : "hidden group-hover/grid-divider:block",
        )}
      ></div>
      <button
        className={clsx(
          "absolute -top-4 left-px h-8 w-2 cursor-grab rounded-full bg-brand-primary",
          isDragging
            ? "block cursor-grabbing"
            : "hidden group-hover/grid-divider:block",
        )}
        style={{
          transform: isDragging
            ? `translateY(${mousePosition + dragPositionDifference - 5}px)`
            : `translateY(${mousePosition}px)`,
        }}
      ></button>
    </div>
  );
};

const FrozenColumnDropzone = ({
  columnId,
  height,
  width,
  virtualColumn,
  leftGridSize,
}: {
  columnId: string;
  height: number;
  width: number;
  virtualColumn: VirtualItem;
  leftGridSize: number;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    type: "OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS",
    id: `FROZEN_COLUMN_${virtualColumn.index}`,
    data: {
      columnId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        height,
        width: width - 10,
        left: virtualColumn.start - leftGridSize + 10,
      }}
      className={clsx(
        "absolute top-0 z-[6]",
        isOver ? "border-r border-r-brand-primary " : "bg-transparent",
      )}
    />
  );
};

const FrozenColumnDropzones = ({
  show,
  dropzoneColumns,
  headers,
  ...props
}: {
  height: number;
  dropzoneColumns: VirtualItem[];
  leftGridSize: number;
  show: boolean;
  headers: Header<ParsedSkylarkObject, string>[];
}) => {
  return show ? (
    <>
      {dropzoneColumns.map((virtualColumn) => {
        const header = headers[virtualColumn.index];
        const key = `grid-sticky-drop-${virtualColumn.index}`;
        if (!header) {
          return <Fragment key={key} />;
        }
        return (
          <FrozenColumnDropzone
            key={key}
            {...props}
            columnId={header.column.id}
            width={header.getSize()}
            virtualColumn={virtualColumn}
          />
        );
      })}
    </>
  ) : (
    <></>
  );
};

const RightGrid = ({
  table,
  totalVirtualSizes,
  rows,
  virtualRows,
  virtualColumns,
  headers,
  leftGridSize,
  panelObject,
  hoveredRow,
  setHoveredRow,
  showFrozenColumnDropZones,
  numberFrozenColumns,
  showSkeletonRows,
}: GridProps) => {
  const [draggedColumn, setDraggedColumn] = useState<{
    id: string;
    width: number;
  } | null>(null);

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.column) {
      const column = event.active.data.current.column as Column<object>;
      column.getSize();
      setDraggedColumn({
        id: column.id,
        width: column.getSize(),
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { getState, setColumnOrder } = table;
    const { columnOrder } = getState();

    if (draggedColumn && event.over?.data.current?.column) {
      const overColumn = event.over?.data.current?.column as Column<object>;

      const newColumnOrder = reorderColumn(
        draggedColumn.id,
        overColumn.id,
        columnOrder,
      );

      setColumnOrder(newColumnOrder);
    }
  }

  return (
    <div className="relative">
      <FrozenColumnDropzones
        show={showFrozenColumnDropZones}
        dropzoneColumns={virtualColumns.slice(
          0,
          MAX_FROZEN_COLUMNS - numberFrozenColumns,
        )}
        leftGridSize={leftGridSize}
        height={totalVirtualSizes.height}
        headers={headers}
      />
      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        modifiers={[restrictToHorizontalAxis]}
      >
        <DragOverlay className="" dropAnimation={null}>
          {draggedColumn ? (
            <div
              className="h-20 bg-black/40"
              style={{
                height: totalVirtualSizes.height,
                width: draggedColumn.width,
              }}
            ></div>
          ) : null}
        </DragOverlay>
        <div
          style={{
            height: virtualRows[0].size,
          }}
          className="sticky top-0 z-[3] w-full bg-white"
        >
          {virtualColumns.map((virtualColumn) => {
            const header = headers[virtualColumn.index];
            const key = `right-grid-header-${virtualColumn.index}`;
            if (!header) {
              return <Fragment key={key} />;
            }

            return (
              <HeaderCell
                key={key}
                header={header}
                virtualColumn={virtualColumn}
                paddingLeft={leftGridSize}
                isDraggable
                onMouseEnter={() => setHoveredRow(null)}
              />
            );
          })}
        </div>
      </DndContext>

      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        const key = `right-grid-row-${virtualRow.index}`;

        if (!row) {
          return <Fragment key={key} />;
        }

        return (
          <LayoutRow
            key={key}
            row={row}
            virtualRow={virtualRow}
            virtualColumns={virtualColumns}
            panelObject={panelObject}
            paddingLeft={leftGridSize}
            hoveredRow={hoveredRow}
            setHoveredRow={setHoveredRow}
          />
        );
      })}
      {showSkeletonRows && (
        <GridSkeleton
          virtualColumns={virtualColumns}
          virtualRows={virtualRows}
          headers={headers}
          totalVirtualSizes={totalVirtualSizes}
          paddingLeft={leftGridSize}
        />
      )}
    </div>
  );
};

const HeaderCell = ({
  header,
  virtualColumn,
  paddingLeft = 0,
  isDraggable,
  onMouseEnter,
}: {
  header: Header<ParsedSkylarkObject, string>;
  virtualColumn: VirtualItem;
  paddingLeft?: number;
  isDraggable?: boolean;
  onMouseEnter: () => void;
}) => {
  const { column } = header;

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    type: "OBJECT_SEARCH_REORDER_COLUMNS",
    id: `drop-${column.id}`,
    data: {
      column,
    },
    disabled: !isDraggable,
  });

  const { attributes, listeners, setNodeRef } = useDraggable({
    type: "OBJECT_SEARCH_REORDER_COLUMNS",
    id: `drag-${column.id}`,
    data: {
      column,
    },
    disabled: !isDraggable,
  });

  return (
    <div
      className={clsx(
        "absolute left-0 top-0 flex h-10 select-none items-center bg-white font-medium",
      )}
      style={{
        width: header.getSize(),
        transform: `translateX(${
          virtualColumn.start - paddingLeft
        }px) translateY(0px)`,
      }}
      ref={(el) => {
        virtualColumn.measureRef(el);
      }}
      onMouseEnter={onMouseEnter}
    >
      <div
        ref={setDropRef}
        className={clsx(
          "absolute bottom-0 left-0 right-0 top-0",
          // isOver && "bg-brand-primary",
        )}
      ></div>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={clsx(
          "z-[1] flex h-full w-full cursor-default items-center",
          header.id === OBJECT_LIST_TABLE.columnIds.checkbox ? "" : "px-1.5",
        )}
      >
        <div className={clsx(headAndDataClassNames, "text-manatee-500")}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      </div>
      {!columnsWithoutResize.includes(header.id) && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className="absolute right-0 z-[2] mr-1 h-4 w-0.5 cursor-col-resize border-r bg-manatee-200"
        />
      )}
    </div>
  );
};

const LayoutRow = ({
  virtualRow,
  hoveredRow,
  setHoveredRow,
  virtualColumns,
  paddingLeft = 0,
  panelObject,
  row,
  ...props
}: {
  virtualRow: VirtualItem;
  row: Row<ParsedSkylarkObject>;
  virtualColumns: VirtualItem[];
  panelObject: SkylarkObjectIdentifier | null;
  paddingLeft?: number;
  isLeft?: boolean;
  hoveredRow: number | null;
  setHoveredRow: (rowId: number | null) => void;
}) => {
  const isPanelObject = panelObject && panelObject.uid === row.original.uid;
  const isHoveredRow = hoveredRow === row.index;

  return (
    <div
      data-row={row.id}
      className={clsx(
        "absolute left-0 top-0 flex outline-none",
        !isHoveredRow && !isPanelObject && "bg-white",
        !isPanelObject && isHoveredRow && "bg-manatee-50",
        isPanelObject && "bg-manatee-100",
      )}
      style={{
        transform: `translateX(${
          virtualColumns[0].start - paddingLeft
        }px) translateY(${virtualRow.start}px)`,
      }}
      onMouseEnter={() => setHoveredRow(row.index)}
    >
      <DataRow
        {...props}
        virtualRow={virtualRow}
        virtualColumns={virtualColumns}
        isDraggable={!!panelObject}
        row={row}
      />
    </div>
  );
};

const DataRow = ({
  virtualRow,
  row,
  virtualColumns,
  isDraggable,
  isLeft,
}: {
  virtualRow: VirtualItem;
  row: Row<ParsedSkylarkObject>;
  virtualColumns: VirtualItem[];
  isDraggable: boolean;
  isLeft?: boolean;
}) => {
  const draggableId = `row-${row.id}-${isLeft ? "left" : ""}`;
  const { attributes, listeners, setNodeRef } = useDraggable({
    type: "CONTENT_LIBRARY_OBJECT",
    id: `row-${row.id}-${isLeft ? "left" : ""}`,
    data: {
      object: row.original,
    },
    disabled: !isDraggable,
  });

  return (
    <div
      ref={setNodeRef}
      data-cy="draggable-item"
      className="flex h-full w-full outline-none"
      {...listeners}
      {...attributes}
      tabIndex={-1}
    >
      {virtualColumns.map((virtualColumn) => {
        const cell = row.getVisibleCells()[virtualColumn.index];
        const key = `${draggableId}-data-${virtualRow.index}-${virtualColumn.index}`;

        if (!cell) {
          return <Fragment key={`${key}+1`} />;
        }

        const cellContext = cell.getContext();

        return (
          <div
            key={key}
            data-cell={cell.id}
            ref={(el) => {
              virtualColumn.measureRef(el);
            }}
            className={clsx(
              "flex cursor-pointer items-center",
              columnsWithoutResize.includes(cell.column.id) ? "" : "px-1.5",
            )}
            style={{
              width: `${virtualColumn.size}px`,
              height: `${virtualRow.size}px`,
            }}
            onClick={() => {
              const tableMeta = cellContext.table.options?.meta;

              if (tableMeta?.onObjectClick) {
                tableMeta.onObjectClick?.(
                  convertParsedObjectToIdentifier(cell.row.original),
                );
                return;
              }

              if (tableMeta?.onRowCheckChange) {
                const checked = Boolean(
                  tableMeta?.checkedRows?.includes(row.index),
                );
                tableMeta.onRowCheckChange({
                  checkedState: !checked,
                  object: row.original,
                });
              }
            }}
          >
            <div
              className={clsx(
                headAndDataClassNames,
                "relative inline-block max-h-full w-full select-text py-0.5",
                [
                  OBJECT_LIST_TABLE.columnIds.dragIcon,
                  OBJECT_LIST_TABLE.columnIds.images,
                ].includes(cell.column.id) && "h-full",
              )}
            >
              {flexRender(cell.column.columnDef.cell, cellContext)}
            </div>
          </div>
        );
      })}
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
