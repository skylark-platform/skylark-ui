import { VisibilityState } from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState, useMemo, memo } from "react";

import { Spinner } from "src/components/icons";
import { useUser } from "src/contexts/useUser";
import { SearchFilters, useSearch } from "src/hooks/useSearch";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";
import { hasProperty, isObjectsDeepEqual } from "src/lib/utils";

import { CreateButtons } from "./createButtons";
import {
  ObjectSearchResults,
  ObjectSearchResultsProps,
} from "./results/objectSearchResults.component";
import {
  OBJECT_SEARCH_HARDCODED_COLUMNS,
  OBJECT_SEARCH_ORDERED_KEYS,
} from "./results/table/columnConfiguration";
import { Search } from "./search";

export interface ObjectListProps {
  withCreateButtons?: boolean;
  withObjectSelect?: boolean;
  withObjectEdit?: boolean;
  isPanelOpen?: boolean;
  panelObject?: SkylarkObjectIdentifier | null;
  setPanelObject?: (obj: SkylarkObjectIdentifier) => void;
  isDragging?: boolean;
  onRowCheckChange: ObjectSearchResultsProps["onRowCheckChange"];
}

export const ObjectSearch = (props: ObjectListProps) => {
  const { defaultLanguage, isLoading: isUserLoading } = useUser();
  const { withCreateButtons, setPanelObject, isPanelOpen } = props;

  const { objectTypes } = useSkylarkObjectTypes(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLanguage, setSearchLanguage] =
    // undefined initially as null is a valid language
    useState<SearchFilters["language"]>(undefined);
  const [searchObjectTypes, setSearchObjectTypes] =
    useState<SearchFilters["objectTypes"]>(null);

  useEffect(() => {
    if (objectTypes && objectTypes.length !== 0 && searchObjectTypes === null) {
      setSearchObjectTypes(objectTypes);
    }
  }, [objectTypes, searchObjectTypes]);

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
  } = useSearch(searchQuery, {
    language: searchLanguage === undefined ? defaultLanguage : searchLanguage,
    objectTypes: searchObjectTypes || objectTypes || null,
  });

  const isSearching = isLoading || isUserLoading;

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedHeaders = useMemo(() => {
    const orderedKeysThatExist =
      properties?.filter((property) =>
        OBJECT_SEARCH_ORDERED_KEYS.includes(property),
      ) || [];

    const orderedProperties =
      properties?.filter(
        (property) => !OBJECT_SEARCH_ORDERED_KEYS.includes(property),
      ) || [];

    return [
      ...OBJECT_SEARCH_HARDCODED_COLUMNS,
      ...orderedKeysThatExist,
      ...orderedProperties,
    ];
  }, [properties]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    Object.fromEntries(sortedHeaders.map((header) => [header, true])),
  );

  useEffect(() => {
    // Update the column visibility when new fields are added / removed
    if (sortedHeaders && sortedHeaders.length !== 0) {
      const newColumnVisibility = Object.fromEntries(
        sortedHeaders.map((header) => [
          header,
          hasProperty(columnVisibility, header)
            ? columnVisibility[header]
            : true,
        ]),
      );
      if (!isObjectsDeepEqual(newColumnVisibility, columnVisibility)) {
        setColumnVisibility(newColumnVisibility);
      }
    }
  }, [sortedHeaders, columnVisibility]);

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
            activeFilters={{
              objectTypes: searchObjectTypes,
              language: searchLanguage,
            }}
            columns={sortedHeaders}
            visibleColumns={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            onLanguageChange={setSearchLanguage}
            onObjectTypeChange={setSearchObjectTypes}
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
      {sortedHeaders.length > 0 && (
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

const objectSearchPropsAreEqual = (
  prevProps: Readonly<ObjectListProps>,
  nextProps: Readonly<ObjectListProps>,
) => {
  const isPanelOpenSame = prevProps.isPanelOpen === nextProps.isPanelOpen;
  const isOnRowCheckChangeSame =
    prevProps.onRowCheckChange === nextProps.onRowCheckChange;
  const isPanelObjectSame =
    prevProps.panelObject?.uid === nextProps.panelObject?.uid &&
    prevProps.panelObject?.objectType === nextProps.panelObject?.objectType;
  const isSetPanelObjectSame =
    prevProps.setPanelObject === nextProps.setPanelObject;

  const areEqual =
    isPanelOpenSame &&
    // isOnRowCheckChangeSame &&
    isPanelObjectSame &&
    isSetPanelObjectSame;

  console.log({
    isPanelOpenSame,
    isOnRowCheckChangeSame,
    isPanelObjectSame,
    isSetPanelObjectSame,
    areEqual,
  });

  return areEqual;
};

export const MemoizedObjectSearch = memo(
  ObjectSearch,
  objectSearchPropsAreEqual,
);

// export const MemoizedObjectSearch = ObjectSearch;
