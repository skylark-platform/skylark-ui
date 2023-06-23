import {
  VisibilityState,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { getObjectDisplayName } from "src/lib/utils";

import { Table } from "./table";
import {
  OBJECT_SEARCH_HARDCODED_COLUMNS,
  createObjectListingColumns,
} from "./table/columnConfiguration";

interface ObjectSearchResultsProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
  isPanelOpen?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  setPanelObject?: (obj: SkylarkObjectIdentifier) => void;
  isDragging?: boolean;
  fetchNextPage?: () => void;
  searchData: ParsedSkylarkObject[];
  sortedHeaders: string[];
  columnVisibility: VisibilityState;
}

export const ObjectSearchResults = ({
  sortedHeaders,
  columnVisibility,
  isPanelOpen,
  panelObject,
  setPanelObject,
  isDragging,
  searchData,
  withObjectSelect,
  withObjectEdit,
  fetchNextPage,
}: ObjectSearchResultsProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [rowInEditMode, setRowInEditMode] = useState("");

  const parsedColumns = useMemo(
    () =>
      createObjectListingColumns(
        sortedHeaders,
        OBJECT_SEARCH_HARDCODED_COLUMNS,
        {
          withObjectSelect,
        },
      ) as ColumnDef<object, ParsedSkylarkObject>[],
    [sortedHeaders, withObjectSelect],
  );

  const formattedSearchData = useMemo(() => {
    const searchDataWithDisplayField = searchData.map((obj) => {
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
          fetchNextPage &&
          searchData.length > 0 &&
          scrollHeight - scrollTop - clientHeight < 500
        ) {
          fetchNextPage();
        }
      }
    },
    [searchData.length, fetchNextPage],
  );

  // a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useReactTable({
    debugAll: false,
    data: formattedSearchData,
    columns: parsedColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    state: {
      columnVisibility,
    },
    meta: {
      rowInEditMode,
      withObjectEdit: !!withObjectEdit,
      onEditClick(rowId) {
        setRowInEditMode(rowId);
      },
      onEditCancelClick() {
        setRowInEditMode("");
      },
    },
  });

  return (
    <div
      className={clsx(
        isDragging ? "overflow-hidden" : "overflow-x-auto",
        "relative mb-6 flex w-full flex-auto flex-grow flex-col overscroll-none md:-ml-4",
      )}
      ref={tableContainerRef}
      data-testid="table-container"
      onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
    >
      <Table
        ref={tableContainerRef}
        table={table}
        withCheckbox={withObjectSelect}
        isLoadingMore={!!fetchNextPage}
        activeObject={panelObject || undefined}
        setPanelObject={setPanelObject}
        withDraggableRow={!!isPanelOpen}
      />
    </div>
  );
};
