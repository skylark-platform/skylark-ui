import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useVirtual } from "react-virtual";

import { AvailabilityLabel } from "src/components/availability";
import { Spinner } from "src/components/icons";
import { Checkbox } from "src/components/inputs/checkbox";
import { Pill } from "src/components/pill";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectAvailability,
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import {
  formatObjectField,
  getObjectDisplayName,
  hasProperty,
} from "src/lib/utils";

import { CreateButtons } from "./createButtons";
import { Search } from "./search";
import { Table, TableCell } from "./table";

const hardcodedColumns = [
  OBJECT_LIST_TABLE.columnIds.translation,
  OBJECT_LIST_TABLE.columnIds.availability,
  OBJECT_LIST_TABLE.columnIds.images,
];
const orderedKeys = ["uid", "external_id", "data_source_id"];

const columnHelper = createColumnHelper<object>();

export interface ObjectListProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
  isPanelOpen?: boolean;
  setPanelObject?: (obj: SkylarkObjectIdentifier) => void;
  isDragging?: boolean;
}

const createColumns = (
  columns: string[],
  opts: { withObjectSelect?: boolean },
) => {
  const objectTypeColumn = columnHelper.accessor(
    OBJECT_LIST_TABLE.columnIds.objectType,
    {
      header: "",
      cell: ({ row }) => {
        const original = row.original as ParsedSkylarkObject;
        return (
          <div className="flex h-full items-center">
            <Pill
              label={
                original.config.objectTypeDisplayName || original.objectType
              }
              bgColor={original.config.colour}
              className="w-full bg-brand-primary"
            />
          </div>
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

  const translationColumn = columnHelper.accessor(
    OBJECT_LIST_TABLE.columnIds.translation,
    {
      header: formatObjectField("Translation"),
      cell: (props) => <TableCell {...props} />,
    },
  );

  const availabilityColumn = columnHelper.accessor("availability", {
    header: formatObjectField("Availability"),
    cell: (props) => {
      const { status } = props.getValue<ParsedSkylarkObjectAvailability>();
      return status && <AvailabilityLabel status={status} />;
    },
  });

  // TODO only add/create this column if the schema has images. Or always created it but hide it when it doesn't have images
  // const imagesColumn = columnHelper.accessor("images", {
  //   header: formatObjectField("Images"),
  //   cell: (props) => {
  //     const imageRelationships =
  //       props.getValue<ParsedSkylarkObjectImageRelationship[]>();
  //     const allImages = imageRelationships.flatMap(({ objects }) => objects);
  //     if (
  //       !imageRelationships ||
  //       imageRelationships.length === 0 ||
  //       allImages.length === 0
  //     ) {
  //       return "";
  //     }

  //     return (
  //       <div>
  //         {allImages.map(({ uid, url, title }) => (
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
    cell: (props) => <TableCell {...props} />,
  });

  const orderedColumnArray = [
    objectTypeColumn,
    displayNameColumn,
    translationColumn,
    // imagesColumn,
    availabilityColumn,
    ...createdColumns,
  ];
  if (opts.withObjectSelect) {
    return [selectColumn, ...orderedColumnArray];
  }
  return [...orderedColumnArray, actionColumn];

  return orderedColumnArray;
};

export const ObjectList = ({
  withCreateButtons,
  withObjectSelect,
  withObjectEdit = false,
  setPanelObject,
  isDragging,
  isPanelOpen,
}: ObjectListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { objectTypes } = useSkylarkObjectTypes(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    objectTypes: null,
    language: null,
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: searchData,
    error: searchError,
    isLoading: searchLoading,
    totalHits,
    properties,
    query: graphqlSearchQuery,
    variables: graphqlSearchQueryVariables,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
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
    () => createColumns(sortedHeaders, { withObjectSelect }),
    [sortedHeaders, withObjectSelect],
  );

  const [rowInEditMode, setRowInEditMode] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    Object.fromEntries(sortedHeaders.map((header) => [header, true])),
  );

  const formattedSearchData = useMemo(() => {
    const searchDataWithDisplayField = searchData?.map((obj) => {
      return {
        ...obj,
        // When the object type is an image, we want to display its preview in the images tab
        images: (
          [
            BuiltInSkylarkObjectType.SkylarkImage,
            BuiltInSkylarkObjectType.BetaSkylarkImage,
          ] as string[]
        ).includes(obj.objectType)
          ? [obj.metadata]
          : obj.images,
        [OBJECT_LIST_TABLE.columnIds.displayField]: getObjectDisplayName(obj),
        [OBJECT_LIST_TABLE.columnIds.translation]: obj.meta.language,
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
          hasNextPage &&
          !searchLoading &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      }
    },
    [
      searchData.length,
      hasNextPage,
      searchLoading,
      isFetchingNextPage,
      fetchNextPage,
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
      withObjectEdit,
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

  useEffect(() => {
    // Update the column visibility when new fields are added
    if (sortedHeaders && sortedHeaders.length !== 0) {
      const headersWithoutVisibility = sortedHeaders.filter(
        (header) => !hasProperty(columnVisibility, header),
      );
      if (headersWithoutVisibility.length > 0) {
        const newColumns = Object.fromEntries(
          headersWithoutVisibility.map((header) => [header, true]),
        );
        setColumnVisibility({
          ...columnVisibility,
          ...newColumns,
        });
      }
    }
  }, [sortedHeaders, columnVisibility]);

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
    estimateSize: useCallback(() => 40, []),
    overscan: 20,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

  return (
    <div
      className={clsx(
        "flex h-full flex-col space-y-2",
        isPanelOpen ? "lg:space-y-2" : "md:space-y-2",
      )}
    >
      <div
        className={clsx(
          "flex w-full items-start space-x-2 md:justify-between",
          isPanelOpen ? "lg:flex-row" : "pr-2 md:flex-row md:pr-8",
        )}
      >
        <div
          className={clsx(
            "flex w-full flex-1 flex-col items-center justify-start space-x-0.5 md:space-x-1",
            withCreateButtons && "md:max-w-[50vw] xl:max-w-[33vw]",
          )}
        >
          <Search
            searchQuery={searchQuery}
            graphqlQuery={{
              query: graphqlSearchQuery,
              variables: graphqlSearchQueryVariables,
            }}
            onQueryChange={setSearchQuery}
            activeFilters={searchFilters}
            columns={sortedHeaders}
            visibleColumns={columnVisibility}
            onFilterChange={onFilterChangeWrapper}
          />
          <div className="mt-2 flex w-full justify-start pl-3 md:pl-7">
            <p className="text-xs font-medium text-manatee-400">
              {searchLoading ? "Loading..." : `${totalHits} results`}
            </p>
          </div>
        </div>
        {withCreateButtons && (
          <CreateButtons
            className={clsx(
              "justify-end md:w-full",
              isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
            )}
            onObjectCreated={(obj) => {
              setPanelObject?.(obj);
            }}
          />
        )}
      </div>
      <div
        className={clsx(
          isDragging ? "overflow-hidden" : "overflow-x-auto",
          "relative mb-6 flex w-full flex-auto flex-grow flex-col overscroll-none md:-ml-4",
        )}
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
            isLoadingMore={hasNextPage || isFetchingNextPage}
            setPanelObject={setPanelObject}
            withDraggableRow={!!isPanelOpen}
          />
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
    </div>
  );
};
