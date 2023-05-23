import { useDraggable } from "@dnd-kit/core";
import {
  Cell,
  flexRender,
  Header,
  Table as ReactTable,
  Row,
  TableMeta,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useMemo } from "react";
import { VirtualItem } from "react-virtual";

import { RowActions } from "src/components/objectListing/rowActions";
import { Skeleton } from "src/components/skeleton";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";

import { DisplayNameTableCell, getCellWidths } from "./cell";

export interface TableProps {
  table: ReactTable<object>;
  withCheckbox?: boolean;
  virtualRows: VirtualItem[];
  totalRows: number;
  withDraggableRow?: boolean;
  isLoadingMore?: boolean;
  activeObject?: SkylarkObjectIdentifier;
  setPanelObject?: (o: SkylarkObjectIdentifier) => void;
}

export interface TableRowProps {
  row: Row<ParsedSkylarkObject>;
  virtualRowSize: number;
  activeObject: TableProps["activeObject"];
  setPanelObject?: TableProps["setPanelObject"];
  tableMeta: TableMeta<object> | undefined;
  withCheckbox?: boolean;
  withDraggableRow?: boolean;
}

const headAndDataClassNames =
  "overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm text-base-content";
const lastHeadAndDataClassNames =
  "last:sticky last:right-0 last:pl-0 last:h-full last:z-10 last:min-w-0 last:border-l-0";
const rowClassName = "group/row hover:bg-manatee-50 hover:border-manatee-50 ";
const activeRowClassName = "bg-manatee-200 border-manatee-200";
const inactiveRowClassName = "bg-white";
const rowGroupClassName =
  "group-hover/row:bg-manatee-50 group-hover/row:border-manatee-50";

const customColumnStyling: Record<
  string,
  {
    className?: {
      all?: string;
      header?: string;
      cell?: string;
      withoutCheckbox?: string;
      withCheckbox?: string;
    };
  }
> = {
  default: {
    className: { all: "pr-1 pl-px" },
  },
  [OBJECT_LIST_TABLE.columnIds.displayField]: {
    className: {
      all: "sm:sticky z-10 pl-0 [&>span]:pl-0 [&>span]:border-l-0 border-l-0 pr-1",
      withoutCheckbox: "left-6",
      withCheckbox: "left-10",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.dragIcon]: {
    className: {
      all: "px-0 hidden md:table-cell",
      cell: "",
      header: "",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.objectType]: {
    className: {
      all: "px-0",
      cell: "absolute z-20 pr-2",
      header: "sm:sticky bg-white w-10 -left-px h-5 pr-1",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.checkbox]: {
    className: { all: "pr-4 pl-0 sticky -left-px absolute z-[41]" },
  },
  images: {
    className: {
      cell: "[&>div]:flex [&>div]:overflow-hidden [&>div]:h-7 [&>div]:md:h-8 pb-0 pt-0.5 md:py-0.5 [&>div]:mr-2 [&>div>img]:mr-0.5 [&>div>img]:h-full",
    },
  },
};
const columnsWithCustomStyling = Object.keys(customColumnStyling);

const columnStyles = (
  column: string,
  type: "header" | "cell",
  withCheckbox?: boolean,
) => {
  const colStyles = columnsWithCustomStyling.includes(column)
    ? customColumnStyling[column]
    : customColumnStyling.default;

  const typeSpecificClassName = colStyles?.className?.[type] || "";
  return `${colStyles.className?.all || ""} ${typeSpecificClassName}  ${
    withCheckbox
      ? colStyles.className?.withCheckbox
      : colStyles.className?.withoutCheckbox
  }`;
};

const TableHeader = ({
  header,
  withCheckbox,
}: {
  header: Header<object, unknown>;
  withCheckbox: boolean;
}) => {
  const className = useMemo(
    () =>
      clsx(
        columnStyles(header.id, "header", withCheckbox),
        headAndDataClassNames,
        lastHeadAndDataClassNames,
        "p-0 pb-2 text-left font-semibold text-opacity-30 last:-z-10",
      ),
    [header.id, withCheckbox],
  );

  return (
    <th
      key={header.id}
      className={className}
      style={{ ...getCellWidths(header.getSize()) }}
    >
      <div className="flex h-full select-none">
        <div className="flex-grow">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </div>
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className="h-inherit w-0.5 cursor-col-resize bg-manatee-200"
        ></div>
      </div>
    </th>
  );
};

const TableData = ({
  cell,
  height,
  withCheckbox,
  tableMeta,
  openPanel,
  object,
  rowIsActive,
}: {
  cell: Cell<ParsedSkylarkObject, unknown>;
  height: number;
  withCheckbox?: boolean;
  tableMeta: TableMeta<object> | undefined;
  openPanel: () => void;
  object: SkylarkObjectIdentifier;
  rowIsActive?: boolean;
}) => {
  const className = useMemo(
    () =>
      clsx(
        columnStyles(cell.column.id, "cell", withCheckbox),
        headAndDataClassNames,
        lastHeadAndDataClassNames,
        rowGroupClassName,
        rowIsActive
          ? activeRowClassName
          : `${inactiveRowClassName} border-transparent`,
        "border-l last:pr-0",
      ),
    [cell.column.id, withCheckbox, rowIsActive],
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
        rowGroupClassName={clsx(
          rowGroupClassName,
          rowIsActive ? activeRowClassName : inactiveRowClassName,
        )}
        colour={cell.row.original.config?.colour}
        width={cell.column.getSize()}
        height={height}
      >
        {children}
      </DisplayNameTableCell>
    );
  }

  if (cell.column.id === OBJECT_LIST_TABLE.columnIds.actions) {
    const rowInEditMode = tableMeta?.rowInEditMode === cell.row.id || false;
    return (
      <td key={cell.id} className={className} style={{ height }}>
        <RowActions
          object={object}
          editRowEnabled={tableMeta?.withObjectEdit}
          inEditMode={rowInEditMode}
          onEditClick={() => tableMeta?.onEditClick(cell.row.id)}
          onInfoClick={openPanel}
          onEditSaveClick={() => console.log(cell.row)}
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

const TableRow = ({
  row,
  activeObject,
  setPanelObject,
  tableMeta,
  withCheckbox,
  withDraggableRow,
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
    disabled: !withDraggableRow,
  });

  const rowIsActive =
    activeObject?.uid === uid && activeObject.language === language;

  const openPanel = () => {
    setPanelObject?.({ uid, objectType, language });
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
        rowClassName,
        rowIsActive && activeRowClassName,
      )}
      tabIndex={-1}
      onClick={openPanel}
      style={{
        height: virtualRowSize,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableData
          tableMeta={tableMeta}
          key={cell.id}
          cell={cell}
          withCheckbox={withCheckbox}
          openPanel={openPanel}
          height={virtualRowSize}
          rowIsActive={rowIsActive}
          object={{ uid, objectType, language }}
        />
      ))}
    </tr>
  );
};

export const Table = ({
  table,
  withCheckbox = false,
  virtualRows,
  totalRows,
  isLoadingMore,
  activeObject,
  setPanelObject,
  withDraggableRow,
}: TableProps) => {
  const tableMeta = table.options.meta;
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalRows - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  const { rows } = table.getRowModel();
  const headers = table.getHeaderGroups()[0].headers;

  return (
    <table
      className="relative mb-10 bg-white"
      width={table.getCenterTotalSize()}
    >
      <thead>
        <tr className="sticky top-0 z-30 bg-white">
          {headers.map((header) => (
            <TableHeader
              key={header.id}
              header={header}
              withCheckbox={withCheckbox}
            />
          ))}
        </tr>
      </thead>

      <tbody className="align-top">
        {paddingTop > 0 && (
          <tr>
            <td style={{ height: `${paddingTop}px` }} />
          </tr>
        )}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index] as Row<ParsedSkylarkObject>;
          return (
            <TableRow
              key={virtualRow.index}
              row={row}
              activeObject={activeObject}
              setPanelObject={setPanelObject}
              tableMeta={tableMeta}
              withCheckbox={withCheckbox}
              withDraggableRow={withDraggableRow}
              virtualRowSize={virtualRow.size}
            />
          );
        })}
        {paddingBottom > 0 && (
          <tr>
            <td style={{ height: `${paddingBottom}px` }} />
          </tr>
        )}
        {totalRows > 0 &&
          isLoadingMore &&
          [...Array(8)].map((e, i) => (
            <tr key={i} className="h-10">
              {headers.map(({ id }) => {
                if (id === OBJECT_LIST_TABLE.columnIds.dragIcon) {
                  return <td key={id}></td>;
                }

                return (
                  <td
                    key={id}
                    className="h-10"
                    style={{ height: virtualRows[0].size }}
                  >
                    <div className="flex h-full w-full items-center justify-start">
                      <Skeleton className={clsx("h-5 w-[95%]")} />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
      </tbody>
    </table>
  );
};
