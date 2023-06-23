import { Header, flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import { useMemo } from "react";

import { getCellWidths } from "./cell";
import { getObjectSearchTableColumnStyles } from "./columnStyles";

export const ObjectListingTableColumnHeader = ({
  header,
  withCheckbox,
}: {
  header: Header<object, unknown>;
  withCheckbox: boolean;
}) => {
  const className = useMemo(
    () =>
      clsx(
        getObjectSearchTableColumnStyles(header.id, "header", { withCheckbox }),
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
