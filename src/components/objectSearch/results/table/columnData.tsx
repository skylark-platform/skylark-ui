import { Cell, TableMeta, flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import { useMemo } from "react";

import { Checkbox } from "src/components/inputs/checkbox";
import { RowActions } from "src/components/objectSearch/rowActions";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";

import {
  DisplayNameTableCell,
  ObjectSelectTableCell,
  getCellWidths,
} from "./cell";
import {
  getObjectSearchDisplayNameCellStyles,
  getObjectSearchTableColumnStyles,
} from "./columnStyles";

export const ObjectListingTableData = ({
  cell,
  height,
  withCheckbox,
  tableMeta,
  openPanel,
  object,
  rowIsActive,
  isDraggable,
}: {
  cell: Cell<ParsedSkylarkObject, unknown>;
  height: number;
  withCheckbox?: boolean;
  tableMeta: TableMeta<object> | undefined;
  openPanel: () => void;
  object: SkylarkObjectIdentifier;
  rowIsActive?: boolean;
  isDraggable?: boolean;
}) => {
  const columnId = cell.column.id;
  const className = useMemo(
    () =>
      clsx(
        getObjectSearchTableColumnStyles(columnId, "cell", {
          withCheckbox,
          rowIsActive:
            rowIsActive && columnId !== OBJECT_LIST_TABLE.columnIds.actions,
        }),
        "last:pr-0",
        OBJECT_LIST_TABLE.columnIds.dragIcon === columnId &&
          !isDraggable &&
          "[&>span]:invisible",
      ),
    [columnId, withCheckbox, rowIsActive, isDraggable],
  );

  const cellValue = cell.getValue();
  const rowInEditMode = tableMeta?.rowInEditMode === cell.row.id || false;

  const children = useMemo(() => {
    // EXPERIMENTAL: Only render cell when value changes, or row is switched into edit mode
    return flexRender(cell.column.columnDef.cell, cell.getContext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellValue, rowInEditMode]);

  // We add some custom styling to the Display Name column so that it displays the object colour indicator
  if (cell.column.id === OBJECT_LIST_TABLE.columnIds.displayField) {
    return (
      <DisplayNameTableCell
        id={cell.id}
        className={className}
        rowGroupClassName={getObjectSearchDisplayNameCellStyles(!!rowIsActive)}
        colour={cell.row.original.config?.colour}
        width={cell.column.getSize()}
        height={height}
        isDraggable={isDraggable}
      >
        {children}
      </DisplayNameTableCell>
    );
  }

  if (cell.column.id === OBJECT_LIST_TABLE.columnIds.checkbox) {
    const checked = Boolean(tableMeta?.checkedRows?.includes(cell.row.index));
    return (
      <ObjectSelectTableCell
        id={cell.id}
        className={className}
        rowGroupClassName={getObjectSearchDisplayNameCellStyles(!!rowIsActive)}
        width={cell.column.getSize()}
        height={height}
        isDraggable={isDraggable}
      >
        <Checkbox
          checked={checked}
          // Not using onCheckChanged so that we have access to the native click event
          onClick={(e) => {
            e.stopPropagation();
            if (e.shiftKey) {
              tableMeta?.batchCheckRows("shift", cell.row.index);
            } else {
              tableMeta?.onRowCheckChange?.({
                checkedState: !checked,
                object: cell.row.original,
              });
            }
          }}
        />
      </ObjectSelectTableCell>
    );
  }

  if (cell.column.id === OBJECT_LIST_TABLE.columnIds.actions) {
    const rowInEditMode = tableMeta?.rowInEditMode === cell.row.id || false;
    return (
      <td
        key={cell.id}
        className={clsx(className, "bg-transparent")}
        style={{ height }}
      >
        <RowActions
          object={object}
          editRowEnabled={tableMeta?.withObjectEdit}
          inEditMode={rowInEditMode}
          onEditClick={() => tableMeta?.onEditClick(cell.row.id)}
          onInfoClick={openPanel}
          onEditSaveClick={() => ""}
          onEditCancelClick={() => tableMeta?.onEditCancelClick()}
        />
      </td>
    );
  }

  return (
    <td
      key={cell.id}
      className={className}
      style={{ ...getCellWidths(cell.column.getSize()), height }}
    >
      {children}
    </td>
  );
};
