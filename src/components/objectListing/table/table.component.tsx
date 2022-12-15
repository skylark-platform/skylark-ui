import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  Table as ReactTable,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState } from "react";

export type TableColumn = string;

export interface TableProps {
  table: ReactTable<object>;
}

const headAndDataClassNames =
  "w-fit min-w-24 max-w-xs overflow-hidden text-ellipsis whitespace-pre pl-3 text-sm text-sm text-base-content";
const firstHeadAndDataClassNames =
  "first:sticky first:left-0 first:pl-0 first:bg-white first:z-10";
const lastHeadAndDataClassNames =
  "last:sticky last:right-0 last:pl-0 last:bg-white last:z-10 last:min-w-0 last:border-l-0";

export const Table = ({ table }: TableProps) => {
  return (
    <table className="relative w-full overflow-x-auto">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className={clsx(
                  headAndDataClassNames,
                  firstHeadAndDataClassNames,
                  lastHeadAndDataClassNames,
                  "ml-4 border-l pr-10 text-left font-semibold text-opacity-30 first:border-l-0 first:pl-0",
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={clsx(
                  headAndDataClassNames,
                  firstHeadAndDataClassNames,
                  lastHeadAndDataClassNames,
                  "p-2",
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
