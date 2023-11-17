import { Header, flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import { VirtualItem } from "react-virtual";

import { columnsWithoutResize } from "src/components/objectSearch/results/columnConfiguration";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { ParsedSkylarkObject } from "src/interfaces/skylark";
import { DragType, useDraggable, useDroppable } from "src/lib/dndkit/dndkit";

export const HeaderCell = ({
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

  const { setNodeRef: setDropRef } = useDroppable({
    type: DragType.OBJECT_SEARCH_REORDER_COLUMNS,
    id: `drop-${column.id}`,
    data: {
      column,
    },
    disabled: !isDraggable,
  });

  const { attributes, listeners, setNodeRef } = useDraggable({
    type: DragType.OBJECT_SEARCH_REORDER_COLUMNS,
    id: `drag-${column.id}`,
    data: {
      column,
    },
    disabled: !isDraggable,
  });

  return (
    <div
      className={clsx(
        // Height is required for before the content loads
        "absolute left-0 top-0 flex h-8 select-none items-center bg-white font-medium",
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
        className={clsx("absolute bottom-0 left-0 right-0 top-0")}
      />
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={clsx(
          "z-[1] flex h-full w-full cursor-default items-center",
          header.id === OBJECT_LIST_TABLE.columnIds.checkbox ? "" : "px-1.5",
        )}
      >
        <div
          className={clsx(
            "overflow-hidden text-ellipsis whitespace-nowrap text-xs text-manatee-500 lg:text-sm",
          )}
        >
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
