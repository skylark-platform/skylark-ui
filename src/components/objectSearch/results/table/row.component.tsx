import { useDraggable } from "@dnd-kit/core";
import { Row, TableMeta } from "@tanstack/react-table";
import clsx from "clsx";

import { ParsedSkylarkObject } from "src/interfaces/skylark";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";

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

  const objectIdentifier = convertParsedObjectToIdentifier(row.original);

  const hasObjectClick = !!tableMeta?.onObjectClick;
  const openPanel = () => tableMeta?.onObjectClick?.(objectIdentifier);

  const handleRowClick = () => {
    if (hasObjectClick) {
      openPanel();
      return;
    }

    if (withCheckbox) {
      const checked = Boolean(tableMeta?.checkedRows?.includes(row.index));
      tableMeta?.onRowCheckChange?.({
        checkedState: !checked,
        object: row.original,
      });
    }
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
      onClick={handleRowClick}
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
          openPanel={hasObjectClick ? openPanel : undefined}
          height={virtualRowSize}
          rowIsActive={rowIsActive}
          object={objectIdentifier}
          isDraggable={isDraggable}
        />
      ))}
    </tr>
  );
};
