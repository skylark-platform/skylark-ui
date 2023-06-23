import {
  VisibilityState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";

import { Spinner } from "src/components/icons";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

import { CreateButtons } from "./createButtons";
import { Search } from "./search";
import { OBJECT_SEARCH_HARDCODED_COLUMNS, OBJECT_SEARCH_ORDERED_KEYS } from "./results/table/columnConfiguration";
import { ObjectSearchResults } from "./results/objectSearchResults.component";



export interface ObjectListProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
  isPanelOpen?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  setPanelObject?: (obj: SkylarkObjectIdentifier) => void;
  isDragging?: boolean;
}



export const ObjectSearch = (props: ObjectListProps) => {
  const { withCreateButtons, setPanelObject, isPanelOpen } = props;

  const [searchQuery, setSearchQuery] = useState("");
  const { objectTypes } = useSkylarkObjectTypes(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    objectTypes: null,
    language: undefined, // undefined initially as null is a valid language
  });
  const [debouncedSearchFilters] = useDebounce(searchFilters, 300);

  const {
    data: searchData,
    error: searchError,
    isLoading,
    totalHits,
    properties,
    query: graphqlSearchQuery,
    variables: graphqlSearchQueryVariables,
    hasNextPage,
    isFetchingNextPage,
    isRefetching: searchRefetching,
    refetch,
    fetchNextPage,
  } = useSearch(searchQuery, debouncedSearchFilters);

  const isSearching =
    isLoading ||
    JSON.stringify(searchFilters) !== JSON.stringify(debouncedSearchFilters);

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedHeaders = useMemo(() => {
    const orderedKeysThatExist =
      properties?.filter((property) => OBJECT_SEARCH_ORDERED_KEYS.includes(property)) || [];

    const orderedProperties =
      properties?.filter((property) => !OBJECT_SEARCH_ORDERED_KEYS.includes(property)) || [];

    return [...OBJECT_SEARCH_HARDCODED_COLUMNS, ...orderedKeysThatExist, ...orderedProperties];
  }, [properties]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    Object.fromEntries(sortedHeaders.map((header) => [header, true])),
  );

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

  return (
    <div
      className={clsx(
        "flex h-full flex-col space-y-2",
        isPanelOpen ? "lg:space-y-2" : "md:space-y-2",
      )}
    >
      <div
        className={clsx(
          "flex w-full flex-col-reverse items-end space-x-2 md:flex-row md:items-start md:justify-between",
          isPanelOpen ? "lg:flex-row" : "pr-2 md:flex-row md:pr-8",
        )}
      >
        <div
          className={clsx(
            "flex w-full flex-1 flex-col items-center justify-start space-x-0.5 md:space-x-1",
            withCreateButtons && "md:max-w-[50vw] xl:max-w-[45vw]",
          )}
        >
          <Search
            searchQuery={searchQuery}
            graphqlQuery={{
              query: graphqlSearchQuery,
              variables: graphqlSearchQueryVariables,
            }}
            isSearching={isSearching || searchRefetching}
            onRefresh={refetch}
            onQueryChange={setSearchQuery}
            activeFilters={searchFilters}
            columns={sortedHeaders}
            visibleColumns={columnVisibility}
            onFilterChange={onFilterChangeWrapper}
          />
          <div className="mt-2 flex w-full justify-start pl-3 md:pl-7">
            <p className="text-xs font-medium text-manatee-400">
              {isSearching ? "Loading..." : `${totalHits || 0} results`}
            </p>
          </div>
        </div>
        {withCreateButtons && (
          <CreateButtons
            className={clsx(
              "mb-2 justify-end md:mb-0 md:w-full",
              isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
            )}
            onObjectCreated={(obj) => {
              setPanelObject?.(obj);
            }}
          />
        )}
      </div>
      {!isSearching && (
        <ObjectSearchResults
          {...props}
          fetchNextPage={
            hasNextPage && !isFetchingNextPage
              ? () => fetchNextPage()
              : undefined
          }
          sortedHeaders={sortedHeaders}
          searchData={searchData}
          columnVisibility={columnVisibility}
        />
      )}
      {(isSearching || (searchData && searchData.length === 0)) && (
        <div className="items-top justify-left flex h-96 w-full flex-col space-y-2 text-sm text-manatee-600 md:text-base">
          {isSearching && (
            <div className="flex w-full justify-center">
              <Spinner className="h-10 w-10 animate-spin" />
            </div>
          )}

          {!isSearching && searchData && searchData.length === 0 && (
            <p className="md:ml-6">{`No results containing all your search terms were found.`}</p>
          )}
        </div>
      )}
    </div>
  );
};
