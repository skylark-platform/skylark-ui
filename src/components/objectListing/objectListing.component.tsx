import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo } from "react";

import { Checkbox } from "src/components/checkbox";
import { Spinner } from "src/components/icons";
import { Panel } from "src/components/panel/panel.component";
import { Pill } from "src/components/pill";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkSearchableObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import {
  ObjectAvailability,
  ObjectAvailabilityStatus,
} from "src/interfaces/skylark/objects";
import { formatObjectField } from "src/lib/utils";

import { CreateButtons } from "./createButtons";
import { RowActions } from "./rowActions";
import { Search } from "./search";
import { Table, TableCell } from "./table";

const displayFields = ["title", "name"];
const hardcodedColumns = ["availability"];
const orderedKeys = [
  "__typename",
  "title",
  "name",
  "uid",
  "external_id",
  "data_source_id",
];

const columnHelper = createColumnHelper<object>();

export type TableColumn = string;

export interface ObjectListProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
}

const createColumns = (
  columns: TableColumn[],
  opts: { withObjectSelect?: boolean; withObjectEdit?: boolean },
  setPanelInfo: ({
    objectType,
    uid,
  }: {
    objectType: string;
    uid: string;
  }) => void,
) => {
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

  const createdColumns = columns
    .filter(
      (column) => ![...displayFields, ...hardcodedColumns].includes(column),
    )
    .map((column) =>
      columnHelper.accessor(column, {
        header: formatObjectField(column),
        cell: (props) => <TableCell {...props} />,
      }),
    );

  const displayNameColumn = columnHelper.accessor(
    OBJECT_LIST_TABLE.columnIds.displayField,
    {
      header: formatObjectField("Display Field"),
      cell: (props) => <TableCell {...props} />,
    },
  );

  const availabilityColumn = columnHelper.accessor("availability", {
    header: formatObjectField("Availability"),
    cell: (props) => {
      const { status } = props.getValue<ObjectAvailability>();
      return (
        <span
          className={clsx(
            "font-medium uppercase",
            status === ObjectAvailabilityStatus.Active && "text-success",
            status === ObjectAvailabilityStatus.Future && "text-warning",
            status === ObjectAvailabilityStatus.Unavailable &&
              "text-manatee-400",
            status === ObjectAvailabilityStatus.Expired && "text-error",
          )}
        >
          {status}
        </span>
      );
    },
  });

  const selectColumn = columnHelper.display({
    id: OBJECT_LIST_TABLE.columnIds.checkbox,
    header: () => <Checkbox aria-label="toggle-select-all-objects" />,
    cell: () => <Checkbox />,
  });

  const actionColumn = columnHelper.display({
    id: OBJECT_LIST_TABLE.columnIds.actions,
    cell: ({ table, row }) => {
      const { uid, __typename: objectType } = row.original as {
        uid: string;
        __typename: string;
      };
      return (
        <RowActions
          editRowEnabled={opts.withObjectEdit}
          inEditMode={table.options.meta?.rowInEditMode === row.id}
          onEditClick={() => table.options.meta?.onEditClick(row.id)}
          onInfoClick={() => setPanelInfo({ objectType, uid })}
          onEditSaveClick={() => console.log(row)}
          onEditCancelClick={() => table.options.meta?.onEditCancelClick()}
        />
      );
    },
  });

  const orderedColumnArray = [
    objectTypeColumn,
    displayNameColumn,
    availabilityColumn,
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
  const [activePanelObject, setActivePanelObject] = useState<{
    objectType: string;
    uid: string;
  } | null>(null);
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
  const sortedHeaders = useMemo(() => {
    const orderedKeysThatExist = properties.filter((property) =>
      orderedKeys.includes(property),
    );

    const orderedProperties = properties.filter(
      (property) => ![...orderedKeys, ...displayFields].includes(property),
    );

    return [...hardcodedColumns, ...orderedKeysThatExist, ...orderedProperties];
  }, [properties]);

  const parsedColumns = useMemo(
    () =>
      createColumns(
        sortedHeaders,
        { withObjectSelect, withObjectEdit },
        setActivePanelObject,
      ),
    [sortedHeaders, withObjectEdit, withObjectSelect],
  );

  const [rowInEditMode, setRowInEditMode] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<
    VisibilityState | undefined
  >(undefined);

  const searchDataWithPrimaryKey = useMemo(
    () =>
      searchData?.map((obj) => {
        const primaryKey = displayFields.find((field) => !!obj[field]);
        return {
          ...obj,
          [OBJECT_LIST_TABLE.columnIds.displayField]: primaryKey
            ? obj[primaryKey]
            : "",
        };
      }),
    [searchData],
  );

  const table = useReactTable({
    debugAll: false,
    data: searchDataWithPrimaryKey || [],
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
    <div className="flex h-full flex-col gap-4 md:gap-8">
      {activePanelObject && (
        <Panel
          closePanel={() => setActivePanelObject(null)}
          uid={activePanelObject.uid}
          objectType={activePanelObject.objectType}
        />
      )}
      <div className="flex w-full flex-col-reverse items-center justify-between gap-2 md:flex-row">
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
        {withCreateButtons && (
          <CreateButtons className="w-full justify-end md:w-auto" />
        )}
      </div>
      <div className="flex h-[70vh] w-full flex-auto flex-col overflow-x-auto overscroll-none pb-6">
        {!searchLoading && searchData && <Table table={table} />}
        {(searchLoading || searchData) && (
          <div className="items-top justify-left flex h-96 w-full flex-col gap-4 text-sm text-manatee-600 md:text-base">
            {searchLoading && (
              <div className="flex w-full justify-center">
                <Spinner className="h-10 w-10 animate-spin" />
              </div>
            )}

            {!searchLoading && searchData && searchData.length === 0 && (
              <p>{`No objects found.`}</p>
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
