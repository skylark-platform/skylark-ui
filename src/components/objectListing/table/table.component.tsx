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

import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

import { DisplayNameTableCell } from "./cell";

export interface TableProps {
  table: ReactTable<object>;
  withCheckbox?: boolean;
  virtualRows: VirtualItem[];
  totalRows: number;
  ableToDrag: boolean;
  setPanelObject?: (obj: { uid: string; objectType: string }) => void;
}

export interface TableRowProps {
  rows: Row<object>[];
  virtualRow: VirtualItem;
  setPanelObject?: (obj: { uid: string; objectType: string }) => void;
  tableMeta: TableMeta<object> | undefined;
  withCheckbox: boolean;
  ableToDrag: boolean;
}

const headAndDataClassNames =
  "overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm text-base-content";
const lastHeadAndDataClassNames =
  "last:sticky last:right-0 last:pl-0 last:bg-white last:z-10 last:min-w-0 last:border-l-0";
const headerLeftLineStyling =
  "[&>span]:border-l [&>span]:pl-2 [&>span]:first:border-l-0 [&>span]:first:pl-0 [&>span]:last:border-l-0 [&>span]:last:pl-0";
const rowGroupClassName =
  "group-hover/row:bg-manatee-50 group-hover/row:border-manatee-50 group-focus/row:bg-manatee-200 group-focus/row:border-manatee-200";

const customColumnStyling: Record<
  string,
  {
    width: string;
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
    width: "min-w-48 max-w-48",
    className: { all: "pr-1" },
  },
  [OBJECT_LIST_TABLE.columnIds.displayField]: {
    width: "min-w-44 max-w-44 md:min-w-52 md:max-w-52",
    className: {
      all: "sm:sticky bg-white z-10 pl-0 [&>span]:pl-0 [&>span]:border-l-0 border-l-0 pr-0",
      withoutCheckbox: "left-2",
      withCheckbox: "left-10",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.objectType]: {
    width: "min-w-20 max-w-20 md:min-w-24 md:max-w-24",
    className: {
      all: "px-0 pr-3",
      cell: "absolute z-20 bg-white",
      header: "sm:sticky bg-white w-10 -left-px",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.checkbox]: {
    width: "min-w-8 max-w-8",
    className: { all: "pr-4 pl-0 sticky -left-px bg-white absolute z-[41]" },
  },
  images: {
    width: "min-w-24 max-w-24",
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
  return `${colStyles.className?.all || ""} ${typeSpecificClassName} ${
    colStyles.width
  } ${
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
        headerLeftLineStyling,
        "p-0 pb-2 text-left font-semibold text-opacity-30 last:-z-10",
      ),
    [header.id, withCheckbox],
  );

  return (
    <th key={header.id} className={className}>
      <span>
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
      </span>
    </th>
  );
};

const TableData = ({
  cell,
  withCheckbox,
  tableMeta,
}: {
  cell: Cell<ParsedSkylarkObject, unknown>;
  withCheckbox: boolean;
  tableMeta: TableMeta<object> | undefined;
}) => {
  const className = useMemo(
    () =>
      clsx(
        columnStyles(cell.column.id, "cell", withCheckbox),
        headAndDataClassNames,
        lastHeadAndDataClassNames,
        rowGroupClassName,
        "border-l border-transparent p-2 last:pr-0",
      ),
    [cell.column.id, withCheckbox],
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
        rowGroupClassName={rowGroupClassName}
        colour={cell.row.original.config?.colour}
      >
        {children}
      </DisplayNameTableCell>
    );
  }

  return (
    <td key={cell.id} className={className}>
      {children}
    </td>
  );
};

const TableRow = ({
  rows,
  virtualRow,
  setPanelObject,
  tableMeta,
  withCheckbox,
  ableToDrag,
}: TableRowProps) => {
  const row = rows[virtualRow.index] as Row<ParsedSkylarkObject>;
  const { uid, objectType } = row.original;
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: uid,
    data: {
      object: row.original,
    },
    disabled: !ableToDrag,
  });
  return (
    <tr
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      key={row.id}
      className="group/row h-6 align-middle outline-none md:h-10"
      tabIndex={-1}
      onDoubleClick={() => setPanelObject?.({ uid, objectType })}
    >
      {row.getVisibleCells().map((cell) => (
        <TableData
          tableMeta={tableMeta}
          key={cell.id}
          cell={cell}
          withCheckbox={withCheckbox}
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
  setPanelObject,
  ableToDrag,
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
    <table className="relative w-full bg-white">
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
          return (
            <TableRow
              key={virtualRow.index}
              rows={rows}
              virtualRow={virtualRow}
              setPanelObject={setPanelObject}
              tableMeta={tableMeta}
              withCheckbox={withCheckbox}
              ableToDrag={ableToDrag}
            />
          );
        })}
        {paddingBottom > 0 && (
          <tr>
            <td style={{ height: `${paddingBottom}px` }} />
          </tr>
        )}
      </tbody>
    </table>
  );
};
