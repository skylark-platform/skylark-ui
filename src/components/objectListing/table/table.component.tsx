import { Header, Table as ReactTable, Row } from "@tanstack/react-table";
import clsx from "clsx";
import { forwardRef, Ref, RefObject, useCallback } from "react";
import { useVirtual } from "react-virtual";

import { Skeleton } from "src/components/skeleton";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";

import { ObjectListingTableColumnHeader } from "./columnHeader";
import { ObjectListingTableRow } from "./row.component";

export interface TableProps {
  table: ReactTable<object>;
  withCheckbox?: boolean;
  withDraggableRow?: boolean;
  isLoadingMore?: boolean;
  activeObject?: SkylarkObjectIdentifier;
  setPanelObject?: (o: SkylarkObjectIdentifier) => void;
}

const TableHead = ({
  headers,
  withCheckbox,
}: {
  headers: Header<object, unknown>[];
  withCheckbox: boolean;
}) => (
  <thead>
    <tr className="sticky top-0 z-30 bg-white">
      {headers.map((header) => (
        <ObjectListingTableColumnHeader
          key={header.id}
          header={header}
          withCheckbox={withCheckbox}
        />
      ))}
    </tr>
  </thead>
);

const TableDataSkeletonLoading = ({
  height,
  headers,
}: {
  height: number;
  headers: Header<object, unknown>[];
}) => (
  <>
    {[...Array(8)].map((e, i) => (
      <tr key={i} className="h-10">
        {headers.map(({ id }) => {
          if (id === OBJECT_LIST_TABLE.columnIds.dragIcon) {
            return <td key={id}></td>;
          }

          return (
            <td key={id} className="h-10" style={{ height }}>
              <div className="flex h-full w-full items-center justify-start">
                <Skeleton className={clsx("h-5 w-[95%]")} />
              </div>
            </td>
          );
        })}
      </tr>
    ))}
  </>
);

export const Table = forwardRef(
  (
    {
      table,
      withCheckbox = false,
      isLoadingMore,
      activeObject,
      setPanelObject,
      withDraggableRow,
    }: TableProps,
    parentRef: Ref<HTMLDivElement>,
  ) => {
    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtual({
      parentRef: parentRef as RefObject<HTMLDivElement>,
      size: rows.length,
      estimateSize: useCallback(() => 42, []),
      overscan: 40,
    });

    const { virtualItems: virtualRows, totalSize: totalRows } = rowVirtualizer;

    const tableMeta = table.options.meta;
    const paddingTop =
      virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
    const paddingBottom =
      virtualRows.length > 0
        ? totalRows - (virtualRows?.[virtualRows.length - 1]?.end || 0)
        : 0;

    const headers = table.getHeaderGroups()[0].headers;

    return (
      <table
        className="relative mb-10 bg-white"
        width={table.getCenterTotalSize()}
      >
        <TableHead headers={headers} withCheckbox={withCheckbox} />

        <tbody className="align-top">
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<ParsedSkylarkObject>;
            return (
              <ObjectListingTableRow
                key={virtualRow.index}
                row={row}
                activeObject={activeObject}
                setPanelObject={setPanelObject}
                tableMeta={tableMeta}
                withCheckbox={withCheckbox}
                isDraggable={withDraggableRow}
                virtualRowSize={virtualRow.size}
              />
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
          {totalRows > 0 && isLoadingMore && (
            <TableDataSkeletonLoading
              height={virtualRows[0].size}
              headers={headers}
            />
          )}
        </tbody>
      </table>
    );
  },
);
Table.displayName = "Table";
