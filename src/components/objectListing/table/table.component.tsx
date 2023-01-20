import {
  Cell,
  flexRender,
  Header,
  Table as ReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useMemo } from "react";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";

export type TableColumn = string;

export interface TableProps {
  table: ReactTable<object>;
  withCheckbox?: boolean;
}

const headAndDataClassNames =
  "overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm text-base-content";
const lastHeadAndDataClassNames =
  "last:sticky last:right-0 last:pl-0 last:bg-white last:z-10 last:min-w-0 last:border-l-0";
const headerLeftLineStyling =
  "[&>span]:border-l [&>span]:pl-2 [&>span]:first:border-l-0 [&>span]:first:pl-0 [&>span]:last:border-l-0 [&>span]:last:pl-0";

const customColumnStyling: Record<
  string,
  {
    width: string;
    className?: {
      all?: string;
      header?: string;
      cell?: string;
      withCheckbox?: string;
    };
  }
> = {
  default: {
    width: "min-w-48 max-w-48",
    className: { all: "pr-1" },
  },
  [OBJECT_LIST_TABLE.columnIds.displayField]: {
    width: "min-w-52 max-w-52",
    className: {
      all: "md:sticky -left-px bg-white z-10 [&>span]:pl-0 [&>span]:border-l-0 border-l-0 pr-0",
      header: "pl-0",
      withCheckbox: "left-5",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.objectType]: {
    width: "min-w-24 max-w-24",
  },
  [OBJECT_LIST_TABLE.columnIds.checkbox]: {
    width: "min-w-6 max-w-6",
    className: { all: "pr-2 pl-0 sticky -left-px bg-white" },
  },
  images: {
    width: "min-w-24 max-w-24",
    className: {
      cell: "flex overflow-hidden h-8 pb-0 pt-0.5 mr-2",
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
  } ${withCheckbox && colStyles.className?.withCheckbox}`;
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
}: {
  cell: Cell<object, unknown>;
  withCheckbox: boolean;
}) => {
  const className = useMemo(
    () =>
      clsx(
        columnStyles(cell.column.id, "cell", withCheckbox),
        headAndDataClassNames,
        lastHeadAndDataClassNames,
        "border-l border-transparent p-2 last:pr-0",
      ),
    [cell.column.id, withCheckbox],
  );

  const cellValue = cell.getValue();
  const children = useMemo(() => {
    // EXPERIMENTAL: Only render cell when value changes
    return flexRender(cell.column.columnDef.cell, cell.getContext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellValue]);

  return (
    <td key={cell.id} className={className}>
      {children}
    </td>
  );
};

export const Table = ({ table, withCheckbox = false }: TableProps) => {
  return (
    <table className="relative w-full bg-white">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="sticky top-0 z-20 bg-white">
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
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableData
                key={cell.id}
                cell={cell}
                withCheckbox={withCheckbox}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
