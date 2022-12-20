import {
  createColumnHelper,
  getCoreRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { Select } from "src/components/select";
import { useListObjects } from "src/hooks/useListObjects";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import { NormalizedObjectField } from "src/interfaces/skylark/objects";

import { CreateButtons } from "./createButtons";
import { RowActions } from "./rowActions";
import { Table } from "./table";

const ignoredKeys = ["__typename"];
const orderedKeys = ["__typename", "title", "name", "uid", "external_id"];

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
                "w-full border-b-2 border-brand-primary py-1 outline-none disabled:border-none disabled:border-manatee-200 disabled:text-manatee-500",
                initialValue !== value && "border-warning",
                value === "" && initialValue !== "" && "border-error",
              )}
              disabled={column.id === "uid"}
            />
          ) : (
            (initialValue as string)
          );
        },
      }),
    ),
    columnHelper.display({
      id: "actions",
      cell: ({ table, row }) => {
        return (
          <RowActions
            editRowEnabled={false}
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
    debugAll: true,
    data: data?.objects || [],
    columns: data?.objects ? parsedColumns : [],
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
    <div className="flex h-full flex-col gap-10">
      <div className="flex w-full flex-row items-center justify-between">
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
      {/* <ColumnFilter table={table} /> */}
      <div className="flex h-[75vh] w-full flex-auto overflow-x-auto">
        {data?.objects && <Table table={table} />}
      </div>
    </div>
  );
};
