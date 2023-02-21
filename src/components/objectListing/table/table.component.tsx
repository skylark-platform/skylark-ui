import { useDraggable, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges, snapCenterToCursor } from "@dnd-kit/modifiers";
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

import { Pill } from "src/components/pill";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SkylarkGraphQLObject } from "src/interfaces/skylark";

import { DisplayNameTableCell } from "./cell";

export type TableColumn = string;

export interface TableProps {
  table: ReactTable<object>;
  withCheckbox?: boolean;
  virtualRows: VirtualItem[];
  totalRows: number;
  activeId: any;
  setPanelObject?: (obj: { uid: string; objectType: string }) => void;
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
  cell: Cell<SkylarkGraphQLObject, unknown>;
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
        colour={cell.row.original._config?.colour}
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
}: any) => {
  const row = rows[virtualRow.index] as Row<SkylarkGraphQLObject>;
  const { uid, objectType } = row.original;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: uid,
    data: {
      record: row.original,
    },
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <tr
      ref={setNodeRef}
      // style={style}
      {...listeners}
      {...attributes}
      key={row.id}
      className="group/row"
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
  activeId,
  setPanelObject,
}: TableProps) => {
  const tableMeta = table.options.meta;
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalRows - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  const { rows } = table.getRowModel();

  console.log("here ###", activeId);

  return (
    <table className="relative w-full bg-white">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="sticky top-0 z-30 bg-white">
            {headerGroup.headers.map((header) => (
              <TableHeader
                key={header.id}
                header={header}
                withCheckbox={withCheckbox}
              />
            ))}
          </tr>
        ))}
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
            />
          );
          const row = rows[virtualRow.index] as Row<SkylarkGraphQLObject>;
          const { uid, objectType } = row.original;
          const { attributes, listeners, setNodeRef, transform } = useDraggable(
            {
              id: "draggable" + virtualRow.index,
            },
          );
          const style = transform
            ? {
                transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              }
            : undefined;

          return (
            <tr
              ref={setNodeRef}
              // style={style}
              {...listeners}
              {...attributes}
              key={row.id}
              className="group/row"
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
        })}
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeId ? (
            <div
              className="my-o flex items-center space-x-2"
              style={{ maxWidth: 250 }}
            >
              <Pill
                label={activeId.__typename as string}
                bgColor={activeId.config.colour}
                className="w-20"
              />
              <div className="flex flex-1">
                <p>{activeId.title || activeId.uid}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
        {paddingBottom > 0 && (
          <tr>
            <td style={{ height: `${paddingBottom}px` }} />
          </tr>
        )}
      </tbody>
    </table>
  );
};
