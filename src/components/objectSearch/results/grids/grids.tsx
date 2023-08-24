import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  snapCenterToCursor,
} from "@dnd-kit/modifiers";
import {
  Table,
  Row,
  Header,
  Column,
  ColumnOrderState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { Fragment, useState, CSSProperties } from "react";
import { VirtualItem } from "react-virtual";

import {
  MAX_FROZEN_COLUMNS,
  OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
} from "src/components/objectSearch/results/columnConfiguration";
import { RowActions } from "src/components/objectSearch/rowActions";
import { Skeleton } from "src/components/skeleton";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import {
  DragEndEvent,
  DragStartEvent,
  DragType,
  useDraggable,
  useDroppable,
} from "src/lib/dndkit/dndkit";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";

import { HeaderCell } from "./headers";
import { LayoutRow } from "./rows";

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
  setHoveredRow?: (rowId: number | null) => void;
  showFrozenColumnDropZones: boolean;
  numberFrozenColumns: number;
  hasScrolledRight: boolean;
  showSkeletonRows: boolean;
}

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

export const ObjectSearchResultsLeftGrid = ({
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
              onMouseEnter={() => setHoveredRow?.(null)}
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

const FrozenColumnDragPill = ({
  style,
  isDragging,
}: {
  style?: CSSProperties;
  isDragging?: boolean;
}) => (
  <button
    className={clsx(
      "absolute -top-4 left-px h-8 w-2 rounded-full bg-brand-primary",
      isDragging
        ? "block cursor-grabbing"
        : "hidden cursor-grab group-hover/grid-divider:block",
    )}
    style={style}
  />
);

export const ObjectSearchResultGridDivider = ({
  leftGridSize,
  totalVirtualSizes,
}: {
  leftGridSize: number;
  totalVirtualSizes: { height: number; width: number };
}) => {
  const [mousePosition, setMousePosition] = useState(0);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      type: DragType.OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS,
      id: "MODIFY_FROZEN_COLUMNS",
      options: {
        modifiers: [snapCenterToCursor],
        dragOverlay: <FrozenColumnDragPill isDragging />,
      },
    });

  const style: CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, 0px, 0)`,
        left: 0,
        display: "block",
        zIndex: 6,
      }
    : undefined;

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
      />
      {!isDragging && (
        <FrozenColumnDragPill
          style={{
            transform: `translateY(${mousePosition}px)`,
          }}
        />
      )}
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
    type: DragType.OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS,
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

export const ObjectSearchResultsRightGrid = ({
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

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.column) {
      const column = event.active.data.current.column as Column<object>;
      column.getSize();
      setDraggedColumn({
        id: column.id,
        width: column.getSize(),
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
  };

  return (
    <div className="relative" data-testid="object-search-results-grid-right">
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
                onMouseEnter={() => setHoveredRow?.(null)}
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
