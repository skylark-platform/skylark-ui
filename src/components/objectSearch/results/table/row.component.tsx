import { useDraggable } from "@dnd-kit/core";
import { Row, TableMeta } from "@tanstack/react-table";
import clsx from "clsx";

import { ParsedSkylarkObject } from "src/interfaces/skylark";

import { ObjectListingTableData } from "./columnData";
import { getObjectSearchTableRowStyles } from "./columnStyles";
import { TableProps } from "./table.component";

export interface TableRowProps {
  row: Row<ParsedSkylarkObject>;
  virtualRowSize: number;
  activeObject: TableProps["activeObject"];
  tableMeta: TableMeta<object> | undefined;
  withCheckbox?: boolean;
  isDraggable?: boolean;
}

export const ObjectListingTableRow = ({
  row,
  activeObject,
  tableMeta,
  withCheckbox,
  isDraggable,
  virtualRowSize,
}: TableRowProps) => {
  const {
    uid,
    objectType,
    meta: { language },
  } = row.original;
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: uid,
    data: {
      object: row.original,
    },
    disabled: !isDraggable,
  });

  const rowIsActive =
    activeObject?.uid === uid && activeObject.language === language;

  const openPanel = () => {
    tableMeta?.onObjectClick?.({ uid, objectType, language });
  };

  return (
    <tr
      data-cy="draggable-item"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      key={row.id}
      className={clsx(
        "relative align-middle outline-none",
        getObjectSearchTableRowStyles(rowIsActive),
      )}
      tabIndex={-1}
      onClick={openPanel}
      style={{
        height: virtualRowSize,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <ObjectListingTableData
          tableMeta={tableMeta}
          key={cell.id}
          cell={cell}
          withCheckbox={withCheckbox}
          openPanel={openPanel}
          height={virtualRowSize}
          rowIsActive={rowIsActive}
          object={{ uid, objectType, language }}
          isDraggable={isDraggable}
        />
      ))}
    </tr>
  );
};
