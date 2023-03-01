import { DragOverlay } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useVirtual } from "react-virtual";

import { Checkbox } from "src/components/checkbox";
import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { Spinner } from "src/components/icons";
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
  ParsedSkylarkObject,
  ParsedSkylarkObjectContentObject,
} from "src/interfaces/skylark";
import { formatObjectField, getPrimaryKey } from "src/lib/utils";

import { CreateButtons } from "./createButtons";
import { RowActions } from "./rowActions";
import { Search } from "./search";
import { Table, TableCell } from "./table";

const hardcodedColumns = ["availability", "images"];
const orderedKeys = ["uid", "external_id", "data_source_id"];

const columnHelper = createColumnHelper<object>();

export interface ObjectListProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
  isPanelOpen?: boolean;
  onInfoClick?: (obj: { uid: string; objectType: string }) => void;
  draggedObject?: ParsedSkylarkObjectContentObject | undefined;
}

const createColumns = (
  columns: string[],
  opts: { withObjectSelect?: boolean; withObjectEdit?: boolean },
  setPanelObject?: ({
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
  // const imagesColumn = columnHelper.accessor("images", {
  //   header: formatObjectField("Images"),
  //   cell: (props) => {
  //     const images = props.getValue<SkylarkGraphQLObjectImage[]>();
  //     if (!images || images.length === 0) {
  //       return "";
  //     }

  //     return (
  //       <div>
  //         {images.map(({ uid, url, title }) => (
  //           // eslint-disable-next-line @next/next/no-img-element
  //           <img src={url} key={`${props.row.id}-${uid}`} alt={title} />
  //         ))}
  //       </div>
  //     );
  //   },
  // });

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
          onInfoClick={() => setPanelObject?.({ objectType, uid })}
          onEditSaveClick={() => console.log(row)}
          onEditCancelClick={() => table.options.meta?.onEditCancelClick()}
        />
      );
    },
  });

  const orderedColumnArray = [
    objectTypeColumn,
    displayNameColumn,
    // imagesColumn,
    availabilityColumn,
    ...createdColumns,
  ];
  if (opts.withObjectSelect) {
    return [selectColumn, ...orderedColumnArray];
  }
  if (setPanelObject) {
    return [...orderedColumnArray, actionColumn];
  }

  return orderedColumnArray;
};

export const ObjectList = ({
  withCreateButtons,
  withObjectSelect,
  withObjectEdit,
  onInfoClick,
  draggedObject,
  isPanelOpen,
}: ObjectListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { objectTypes } = useSkylarkObjectTypes();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    objectTypes: null,
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: searchData,
    error: searchError,
    loading: searchLoading,
    properties,
    query: graphqlSearchQuery,
    variables: graphqlSearchQueryVariables,
    moreResultsAvailable,
    fetchingMore,
    fetchMoreResults,
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
        onInfoClick,
      ),
    [sortedHeaders, withObjectEdit, withObjectSelect, onInfoClick],
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

    // Move all entries in .metadata into the top level as tanstack-table outputs a warning messaged saying nested properties that are undefined
    const searchDataWithTopLevelMetadata = searchDataWithDisplayField.map(
      (obj) => ({
        ...obj.metadata,
        ...obj,
      }),
    );

    return searchDataWithTopLevelMetadata;
  }, [searchData]);
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        // once the user has scrolled within 500px of the bottom of the table, fetch more data if there is any
        if (
          searchData.length > 0 &&
          scrollHeight - scrollTop - clientHeight < 500 &&
          moreResultsAvailable &&
          !searchLoading &&
          !fetchingMore
        ) {
          fetchMoreResults();
        }
      }
    },
    [
      searchData.length,
      moreResultsAvailable,
      searchLoading,
      fetchingMore,
      fetchMoreResults,
    ],
  );

  // a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

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

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 40,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

  const primaryKey = draggedObject && getPrimaryKey(draggedObject);

  return (
    <div
      className={clsx(
        "flex h-full flex-col space-y-4",
        isPanelOpen ? "lg:space-y-8" : "md:space-y-8",
      )}
    >
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {draggedObject ? (
          <div className="my-o flex max-w-[350px] items-center space-x-2 ">
            <Pill
              label={draggedObject.object.__typename as string}
              bgColor={draggedObject.config.colour}
              className="w-20"
            />
            <div className="flex flex-1">
              <p>
                {primaryKey
                  ? draggedObject.object[primaryKey]
                  : draggedObject.object.uid}
              </p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      <div
        className={clsx(
          "flex w-full items-center space-x-1 md:justify-between",
          isPanelOpen ? "lg:flex-row" : "pr-2 md:flex-row md:pr-8",
        )}
      >
        <div
          className={clsx(
            "flex w-full flex-1 flex-row items-center justify-center space-x-0.5 md:space-x-1",
            withCreateButtons &&
              !isPanelOpen &&
              "md:max-w-[50%] xl:max-w-[33%]",
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
          <CreateButtons
            className={clsx(
              "justify-end pr-2 md:w-full",
              isPanelOpen ? "lg:w-auto" : "md:w-auto",
            )}
          />
        )}
      </div>
      <div
        className={`${
          draggedObject ? "overflow-hidden" : "overflow-x-auto"
        } relative mb-6 flex w-full flex-auto flex-grow flex-col overscroll-none`}
        ref={tableContainerRef}
        data-testid="table-container"
        onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
      >
        {!searchLoading && searchData && (
          <Table
            table={table}
            virtualRows={virtualRows}
            totalRows={totalSize}
            withCheckbox={withObjectSelect}
            setPanelObject={onInfoClick}
            withDraggableRow={!!isPanelOpen}
          />
        )}
        {!searchLoading && searchData && fetchingMore && (
          <div className="sticky left-0 right-0 bottom-2 flex items-center justify-center">
            <Spinner className="-z-10 h-8 w-8 animate-spin md:h-10 md:w-10" />
          </div>
        )}
        {(searchLoading || searchData) && (
          <div className="items-top justify-left flex h-96 w-full flex-col space-y-2 text-sm text-manatee-600 md:text-base">
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
