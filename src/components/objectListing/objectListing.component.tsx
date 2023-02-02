import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, useRef } from "react";
import { useVirtual } from "react-virtual";

import { Checkbox } from "src/components/checkbox";
import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { Spinner } from "src/components/icons";
import { Panel } from "src/components/panel/panel.component";
import { Pill } from "src/components/pill";
import {
  DISPLAY_NAME_PRIORITY,
  OBJECT_LIST_TABLE,
} from "src/constants/skylark";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectAvailability,
  AvailabilityStatus,
  SkylarkGraphQLObjectImage,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

import { CreateButtons } from "./createButtons";
import { RowActions } from "./rowActions";
import { Search } from "./search";
import { Table, TableCell } from "./table";

const hardcodedColumns = ["availability", "images"];
const orderedKeys = ["uid", "external_id", "data_source_id"];

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
  const objectTypeColumn = columnHelper.accessor(
    OBJECT_LIST_TABLE.columnIds.objectType,
    {
      header: "",
      cell: ({ row }) => {
        const original = row.original as ParsedSkylarkObject;
        return (
          <Pill
            label={original.objectType}
            bgColor={original.config.colour}
            className="w-full bg-brand-primary"
          />
        );
      },
    },
  );

  const createdColumns = columns
    .filter((column) => !hardcodedColumns.includes(column))
    .map((column) =>
      columnHelper.accessor(column, {
        id: column,
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
      const { status } = props.getValue<ParsedSkylarkObjectAvailability>();
      return (
        <span
          className={clsx(
            "font-medium uppercase",
            status === AvailabilityStatus.Active && "text-success",
            status === AvailabilityStatus.Future && "text-warning",
            status === AvailabilityStatus.Unavailable && "text-manatee-400",
            status === AvailabilityStatus.Expired && "text-error",
          )}
        >
          {status}
        </span>
      );
    },
  });

  // TODO only add/create this column if the schema has images. Or always created it but hide it when it doesn't have images
  const imagesColumn = columnHelper.accessor("images", {
    header: formatObjectField("Images"),
    cell: (props) => {
      const images = props.getValue<SkylarkGraphQLObjectImage[]>();
      if (!images || images.length === 0) {
        return "";
      }

      return (
        <>
          {images.map(({ uid, url, title }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} key={`${props.row.id}-${uid}`} alt={title} />
          ))}
        </>
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
    imagesColumn,
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
  const { objectTypes } = useSkylarkObjectTypes();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    objectTypes: null,
  });

  const {
    data: searchData,
    error: searchError,
    loading: searchLoading,
    properties,
    query: graphqlSearchQuery,
    variables: graphqlSearchQueryVariables,
  } = useSearch(searchQuery, searchFilters);

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedHeaders = useMemo(() => {
    const orderedKeysThatExist = properties.filter((property) =>
      orderedKeys.includes(property),
    );

    const orderedProperties = properties.filter(
      (property) => !orderedKeys.includes(property),
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

  const formattedSearchData = useMemo(() => {
    const searchDataWithDisplayField = searchData?.map((obj) => {
      const primaryKey = [
        obj.config.primaryField || "",
        ...DISPLAY_NAME_PRIORITY,
      ].find((field) => !!obj.metadata[field]);
      return {
        ...obj,
        // When the object type is an image, we want to display its preview in the images tab
        images: obj.objectType === "Image" ? [obj.metadata] : obj.images,
        [OBJECT_LIST_TABLE.columnIds.displayField]: primaryKey
          ? obj.metadata[primaryKey]
          : "",
      };
    });

    // Move all entries in .metadata into the top level as tanstack-table doesn't support nested properties that are undefined
    // TODO when https://github.com/TanStack/table/pull/4620 is merged we can remove this, and handle global/language metadata differently
    const searchDataWithTopLevelMetadata = searchDataWithDisplayField.map(
      (obj) => ({
        ...obj.metadata,
        ...obj,
      }),
    );

    return searchDataWithTopLevelMetadata;
  }, [searchData]);

  const table = useReactTable({
    debugAll: false,
    data: formattedSearchData || [],
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
    if (
      objectTypes &&
      objectTypes.length !== 0 &&
      searchFilters.objectTypes === null
    ) {
      setSearchFilters({ ...searchFilters, objectTypes: objectTypes });
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

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 15,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

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
            "flex w-full flex-row gap-2 md:gap-4",
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
          <DisplayGraphQLQuery
            label="Content Library Search"
            query={graphqlSearchQuery}
            variables={graphqlSearchQueryVariables}
          />
        </div>
        {withCreateButtons && (
          <CreateButtons className="w-full justify-end md:w-auto" />
        )}
      </div>
      <div
        className="flex h-[70vh] w-full flex-auto flex-col overflow-x-auto overscroll-none pb-6 xl:h-[75vh]"
        ref={tableContainerRef}
      >
        {!searchLoading && searchData && (
          <Table
            table={table}
            virtualRows={virtualRows}
            totalRows={totalSize}
            withCheckbox={withObjectSelect}
          />
        )}
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
