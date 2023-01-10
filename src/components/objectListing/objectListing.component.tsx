import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import { Checkbox } from "src/components/checkbox";
import { Spinner } from "src/components/icons";
import { Pill } from "src/components/pill";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkSearchableObjectTypes } from "src/hooks/useSkylarkObjectTypes";

import { CreateButtons } from "./createButtons";
import { RowActions } from "./rowActions";
import { Search } from "./search/search.component";
import { Table } from "./table";

const orderedKeys = ["__typename", "title", "name", "uid", "external_id"];

const columnHelper = createColumnHelper<object>();

export type TableColumn = string;

export interface ObjectListProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
}

const formatColumnHeader = (header: string) =>
  header.toLocaleUpperCase().replaceAll("_", " ");

const createColumns = (
  columns: TableColumn[],
  opts: { withObjectSelect?: boolean; withObjectEdit?: boolean },
) => {
  const createdColumns = columns.map((column) =>
    columnHelper.accessor(column, {
      header: formatColumnHeader(column),
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
  );

  const objectTypeColumn = columnHelper.accessor("__typename", {
    header: "",
    cell: ({ getValue }) => {
      return (
        <Pill
          label={getValue() as string}
          className="w-full bg-brand-primary"
        />
      );
    },
  });

  const selectColumn = columnHelper.display({
    id: OBJECT_LIST_TABLE.columnIds.checkbox,
    header: () => <Checkbox />,
    cell: () => <Checkbox />,
  });

  const actionColumn = columnHelper.display({
    id: OBJECT_LIST_TABLE.columnIds.actions,
    cell: ({ table, row }) => {
      return (
        <RowActions
          editRowEnabled={opts.withObjectEdit}
          inEditMode={table.options.meta?.rowInEditMode === row.id}
          onEditClick={() => table.options.meta?.onEditClick(row.id)}
          onInfoClick={() => console.log(row)}
          onEditSaveClick={() => console.log(row)}
          onEditCancelClick={() => table.options.meta?.onEditCancelClick()}
        />
      );
    },
  });

  const orderedColumnArray = [
    objectTypeColumn,
    ...createdColumns,
    actionColumn,
  ];
  if (opts.withObjectSelect) {
    return [selectColumn, ...orderedColumnArray];
  }

  return orderedColumnArray;
};

export const ObjectList = ({
  withCreateButtons,
  withObjectSelect,
  withObjectEdit,
}: ObjectListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { objectTypes } = useSkylarkSearchableObjectTypes();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    objectTypes: null,
  });

  const {
    data: searchData,
    error: searchError,
    loading: searchLoading,
    properties,
  } = useSearch(searchQuery, searchFilters);

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedHeaders = properties.sort((a: string, b: string) => {
    if (orderedKeys.indexOf(a) === -1) {
      return 1;
    }
    if (orderedKeys.indexOf(b) === -1) {
      return -1;
    }
    return orderedKeys.indexOf(a) - orderedKeys.indexOf(b);
  });

  const parsedColumns = useMemo(
    () => createColumns(sortedHeaders, { withObjectSelect, withObjectEdit }),
    [sortedHeaders, withObjectSelect],
  );

  const [rowInEditMode, setRowInEditMode] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<
    VisibilityState | undefined
  >(undefined);

  const table = useReactTable({
    debugAll: false,
    data: searchData || [],
    columns: searchData ? parsedColumns : [],
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
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

  useEffect(() => {
    if (objectTypes.length !== 0 && searchFilters.objectTypes === null) {
      setSearchFilters({ ...searchFilters, objectTypes });
    }
  }, [objectTypes, searchFilters]);

  const onFilterChangeWrapper = (
    updatedFilters: SearchFilters,
    updatedColumnVisibility: VisibilityState,
  ) => {
    setSearchFilters(updatedFilters);
    setColumnVisibility(updatedColumnVisibility);
  };

  if (searchError) console.error("Search Errors:", { searchError });

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex w-full flex-row items-center justify-between">
        <div
          className={clsx(
            "flex w-full flex-row-reverse gap-4",
            withCreateButtons ? "md:w-1/2 xl:w-1/3" : "flex-1",
          )}
        >
          <Search
            objectTypes={objectTypes || []}
            searchQuery={searchQuery}
            onQueryChange={setSearchQuery}
            activeFilters={searchFilters}
            columns={sortedHeaders}
            visibleColumns={
              columnVisibility !== undefined
                ? Object.keys(columnVisibility).filter(
                    (col) => !!columnVisibility[col],
                  )
                : sortedHeaders
            }
            onFilterChange={onFilterChangeWrapper}
          />
        </div>
        {withCreateButtons && <CreateButtons />}
      </div>
      <div className="flex h-[70vh] w-full flex-auto flex-col overflow-x-auto overscroll-none pb-6">
        {!searchLoading && searchData && <Table table={table} />}
        {(searchLoading || searchData) && (
          <div className="flex h-96 w-full flex-col items-center justify-center gap-4">
            {searchLoading && (
              <>
                <p>Loading...</p>
                <Spinner className="h-10 w-10 animate-spin" />
              </>
            )}

            {!searchLoading && searchData && searchData.length === 0 && (
              <p>{`No results found for query: "${searchQuery}"`}</p>
            )}
          </div>
        )}
      </div>
      {searchError && (
        <p className="text-xs text-error">{`Errors hit when requesting data: ${searchError.graphQLErrors.length}. See console.`}</p>
      )}
    </div>
  );
};
