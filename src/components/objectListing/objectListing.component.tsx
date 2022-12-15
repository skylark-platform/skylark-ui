import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { Button } from "src/components/button";
import { Edit, InfoCircle } from "src/components/icons";
import { Select } from "src/components/select";
import { useListObjects } from "src/hooks/useListObjects";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import {
  NormalizedObjectField,
  SkylarkObjectType,
} from "src/interfaces/skylark/objects";

import { CreateButtons } from "./createButtons";
import { ColumnFilter } from "./filters";
import { RowActions } from "./rowActions";
import { Table } from "./table";

const columnHelper = createColumnHelper<object>();

export type TableColumn = string;

export interface ObjectListProps {
  withCreateButtons?: boolean;
}

// TODO move this somewhere better?
// https://github.com/TanStack/table/pull/4539
declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    rowInEditMode: string;
    onEditClick: (rowId: string) => void;
    onEditCancelClick: () => void;
  }
}

const createColumns = (columns: TableColumn[]) => {
  return [
    ...columns.map((column) =>
      columnHelper.accessor(column, {
        sortDescFirst: column === "slug" ? true : undefined,
        cell: ({ getValue, row, column, table }) => {
          const initialValue = getValue();
          // We need to keep and update the state of the cell normally
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [value, setValue] = useState(initialValue);

          // When the input is blurred, we'll call our table meta's updateData function
          // const onBlur = () => {
          //   table.options.meta?.updateData(index, id, value);
          // };

          // If the initialValue is changed external, sync it up with our state
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            setValue(initialValue);
          }, [initialValue]);

          return row.id === table.options.meta?.rowInEditMode ? (
            <input
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              className={clsx(
                "w-full rounded border-2 border-brand-primary p-2 px-2 shadow disabled:border-manatee-200 disabled:text-manatee-500 disabled:shadow-none",
                initialValue !== value && "border-warning",
                value === "" && initialValue !== "" && "border-error",
              )}
              // onBlur={onBlur}
              disabled={column.id === "uid"}
            />
          ) : (
            <span>{value as string}</span>
          );
        },
      }),
    ),
    columnHelper.display({
      id: "actions",
      cell: ({ table, row }) => {
        return (
          <RowActions
            inEditMode={table.options.meta?.rowInEditMode === row.id}
            onEditClick={() => table.options.meta?.onEditClick(row.id)}
            onInfoClick={() => console.log(row)}
            onEditSaveClick={() => console.log(row)}
            onEditCancelClick={() => table.options.meta?.onEditCancelClick()}
          />
        );
      },
    }),
  ];
};

export const ObjectList = ({ withCreateButtons }: ObjectListProps) => {
  const { query, push, pathname } = useRouter();
  const { objectTypes } = useSkylarkObjectTypes();
  const [objectType, setObjectType] = useState("");
  const { data, fields } = useListObjects(objectType);

  const ignoredKeys = ["__typename"];
  const orderedKeys = ["__typename", "title", "name", "uid", "external_id"];
  const objectProperties = fields
    ? fields.filter((key) => !ignoredKeys.includes(key.name))
    : [];

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedProperties = objectProperties.sort(
    (a: NormalizedObjectField, b: NormalizedObjectField) => {
      if (orderedKeys.indexOf(a.name) === -1) {
        return 1;
      }
      if (orderedKeys.indexOf(b.name) === -1) {
        return -1;
      }
      return orderedKeys.indexOf(a.name) - orderedKeys.indexOf(b.name);
    },
  );

  const [rowInEditMode, setRowInEditMode] = useState("");

  const parsedColumns = createColumns(sortedProperties.map(({ name }) => name));
  const [columnVisibility, setColumnVisibility] = useState({});

  const table = useReactTable({
    debugTable: true,
    data: data?.objects || [],
    columns: parsedColumns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      rowInEditMode,
      onEditClick(rowId) {
        setRowInEditMode(rowId);
      },
      onEditCancelClick() {
        setRowInEditMode("");
      },
    },
  });

  return (
    <div>
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <Select
          className="w-64"
          placeholder="Select Skylark object"
          options={
            objectTypes?.sort().map((objectType) => ({
              label: objectType,
              value: objectType,
            })) || []
          }
          onChange={(value) => {
            setObjectType(value as string);
            push({
              pathname,
              query: {
                objectType: value,
              },
            });
          }}
          initialValue={query?.objectType as string}
        />
        {withCreateButtons && <CreateButtons />}
      </div>
      <ColumnFilter table={table} />

      <div className="w-full overflow-x-auto">
        <Table table={table} />
      </div>
    </div>
  );
};
