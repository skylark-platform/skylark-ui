import { closestCenter } from "@dnd-kit/core";
import { Row, TableMeta, flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import { Fragment } from "react";
import { VirtualItem } from "react-virtual";

import {
  ObjectSearchTableData,
  columnsWithoutResize,
} from "src/components/objectSearch/results/columnConfiguration";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";
import { DragType, useSortable } from "src/lib/dndkit/dndkit";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { platformMetaKeyClicked } from "src/lib/utils";

interface DataRowProps {
  tableId: string;
  tableMeta?: TableMeta<ObjectSearchTableData>;
  virtualRow: VirtualItem;
  row: Row<ObjectSearchTableData>;
  virtualColumns: VirtualItem[];
  isLeft?: boolean;
}

interface LayoutRowProps extends DataRowProps {
  panelObject: SkylarkObjectIdentifier | null;
  paddingLeft?: number;
  hoveredRow: number | null;
  setHoveredRow?: (rowId: number | null) => void;
}

const DataRow = ({
  tableId,
  tableMeta,
  virtualRow,
  row,
  virtualColumns,
  isDraggable,
  isLeft,
}: DataRowProps & { isDraggable: boolean }) => {
  const draggableId = `${tableId}-row-${row.id}-${isLeft ? "left" : "right"}`;

  // useSortable not useDraggable so that the Panel Content tab can sort when a row is dragged in
  const { attributes, listeners, setNodeRef } = useSortable({
    type: DragType.CONTENT_LIBRARY_OBJECT,
    id: draggableId,
    data: {
      object: row.original,
      checkedObjectsState: tableMeta?.checkedObjectsState || [],
    },
    options: {
      // collisionDetection: closestCenter,
    },
    disabled: !isDraggable,
  });

  return (
    <div
      ref={setNodeRef}
      data-cy="object-search-results-row-draggable"
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
            onClick={(e) => {
              const tableMeta = cellContext.table.options?.meta;

              if (platformMetaKeyClicked(e)) {
                window.open(
                  `/object/${cell.row.original.objectType}/${cell.row.original.uid}?language=${cell.row.original.meta.language}`,
                  "_blank",
                );
                return;
              }

              if (tableMeta?.onObjectClick) {
                tableMeta.onObjectClick?.(
                  convertParsedObjectToIdentifier(cell.row.original),
                );
                return;
              }

              if (tableMeta?.onRowCheckChange) {
                tableMeta.onRowCheckChange({
                  checkedState: !row.getIsSelected(),
                  object: row.original,
                });
              }
            }}
          >
            <div
              className={clsx(
                "relative inline-block max-h-full w-full select-text overflow-hidden text-ellipsis whitespace-nowrap py-0.5 text-xs text-base-content lg:text-sm",
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

export const LayoutRow = ({
  virtualRow,
  hoveredRow,
  setHoveredRow,
  virtualColumns,
  paddingLeft = 0,
  panelObject,
  row,
  ...props
}: LayoutRowProps) => {
  const isPanelObject = panelObject && panelObject.uid === row.original.uid;
  const isHoveredRow = hoveredRow === row.index;

  return (
    <div
      data-row={row.id}
      data-testid="object-search-results-row"
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
      onMouseEnter={() => setHoveredRow?.(row.index)}
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
