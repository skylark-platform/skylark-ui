import { flexRender, Table as ReactTable } from "@tanstack/react-table";
import clsx from "clsx";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";

export type TableColumn = string;

export interface TableProps {
  table: ReactTable<object>;
}

const headAndDataClassNames =
  "overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm text-base-content max-w-52 z-20";
const displayFieldClassNames =
  "md:sticky left-0 pl-0 bg-white z-10 [&>span]:pl-0 [&>span]:border-l-0";
const lastHeadAndDataClassNames =
  "last:sticky last:right-0 last:pl-0 last:bg-white last:z-10 last:min-w-0 last:border-l-0";

export const Table = ({ table }: TableProps) => {
  return (
    <table className="relative w-full bg-white">
      <thead>
        {table.getHeaderGroups().map((headerGroup, headerGroupIndex) => (
          <tr key={headerGroup.id} className="sticky top-0 z-20 bg-white">
            {headerGroup.headers.map((header, headerIndex) => (
              <th
                key={header.id}
                className={clsx(
                  headAndDataClassNames,
                  lastHeadAndDataClassNames,
                  // Use Tailwind & selector to use first: selector on span - used for left-border line styling
                  "ml-4 p-0 pb-2 text-left font-semibold text-opacity-30 last:-z-10 [&>span]:border-l [&>span]:pl-2 [&>span]:first:border-l-0 [&>span]:first:pl-0 [&>span]:last:border-l-0 [&>span]:last:pl-0",
                  // Style the checkbox column slightly differently
                  header.id === OBJECT_LIST_TABLE.columnIds.displayField &&
                    displayFieldClassNames,
                  header.id === OBJECT_LIST_TABLE.columnIds.checkbox
                    ? "pr-2"
                    : "pr-4",
                  // Pin checkbox if it is the first header
                  // headerGroupIndex === 0 &&
                  //   headerIndex === 0 &&
                  //   header.id === OBJECT_LIST_TABLE.columnIds.checkbox &&
                  //   firstHeadAndDataClassNames,
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

      <tbody className="align-top">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell, cellIndex) => (
              <td
                key={cell.id}
                className={clsx(
                  headAndDataClassNames,
                  lastHeadAndDataClassNames,
                  "border-l border-transparent p-2 last:pr-0",
                  cell.column.id === OBJECT_LIST_TABLE.columnIds.displayField &&
                    displayFieldClassNames,
                  // cellIndex === 0 &&
                  //   cell.column.id === OBJECT_LIST_TABLE.columnIds.checkbox &&
                  //   firstHeadAndDataClassNames,
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
