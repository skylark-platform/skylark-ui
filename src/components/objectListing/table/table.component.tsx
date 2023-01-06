import { flexRender, Table as ReactTable } from "@tanstack/react-table";
import clsx from "clsx";

export type TableColumn = string;

export interface TableProps {
  table: ReactTable<object>;
}

const headAndDataClassNames =
  "overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm text-base-content max-w-52 z-20";
const firstHeadAndDataClassNames =
  "md:first:sticky first:left-0 first:pl-0 first:bg-white first:z-10";
const lastHeadAndDataClassNames =
  "last:sticky last:right-0 last:pl-0 last:bg-white last:z-10 last:min-w-0 last:border-l-0";

export const Table = ({ table }: TableProps) => {
  return (
    <table className="relative w-full bg-white">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="sticky top-0 z-20 bg-white">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className={clsx(
                  headAndDataClassNames,
                  // firstHeadAndDataClassNames,
                  lastHeadAndDataClassNames,
                  // Use Tailwind & selector to use first: selector on span - used for left-border line styling
                  "ml-4 p-0 pr-4 pb-2 text-left font-semibold text-opacity-30 last:-z-10 [&>span]:border-l [&>span]:pl-2 [&>span]:first:border-l-0 [&>span]:first:pl-0 [&>span]:last:border-l-0 [&>span]:last:pl-0",
                )}
              >
                <span>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </span>
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
                  // firstHeadAndDataClassNames,
                  lastHeadAndDataClassNames,
                  "border-l border-transparent p-2 first:border-l-0 first:pl-0 last:pr-0",
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
