import { VisibilityState } from "@tanstack/react-table";
import { DocumentNode } from "graphql";
import { useMemo, useState } from "react";

import { Button } from "src/components/button";
import {
  CheckboxGrid,
  createCheckboxOptions,
} from "src/components/checkboxGrid/checkboxGrid.component";
import { RadioGroup } from "src/components/inputs/radioGroup/radioGroup.component";
import { DisplayGraphQLQuery } from "src/components/modals";
import { SearchFilters } from "src/hooks/useSearch";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import { ParsedSkylarkObjectConfig } from "src/interfaces/skylark";

interface SearchFilterProps {
  searchType: SearchType;
  activeObjectTypes: SearchFilters["objectTypes"];
  objectTypesWithConfig: {
    objectType: string;
    config?: ParsedSkylarkObjectConfig;
  }[];
  columns: { value: string; label?: string }[];
  visibleColumns: string[];
  graphqlQuery: {
    query: DocumentNode | null;
    variables: object;
    headers: HeadersInit;
  };
  onFilterSave: (f: {
    filters: Partial<SearchFilters>;
    columnVisibility: VisibilityState;
    searchType: SearchType;
  }) => void;
}

const convertCheckedColumnsToVisibilityState = (
  checked: string[],
  columns: string[],
) =>
  checked.length > 0
    ? columns.reduce(
        (prev, col) => ({
          ...prev,
          [col]: checked.includes(col),
        }),
        {},
      )
    : {};

const searchTypeOptions = [
  { label: "Search", value: SearchType.Search },
  {
    label: "UID & External ID",
    value: SearchType.UIDExtIDLookup,
  },
];

export const SearchFilter = ({
  searchType: activeSearchType,
  activeObjectTypes,
  objectTypesWithConfig,
  columns,
  visibleColumns,
  graphqlQuery,
  onFilterSave,
}: SearchFilterProps) => {
  const [searchType, updateSearchType] = useState<{
    label: string;
    value: SearchType;
  }>(
    searchTypeOptions.find(({ value }) => value === activeSearchType) ||
      searchTypeOptions[0],
  );
  const [updatedObjectTypes, updateObjectTypes] = useState(
    activeObjectTypes || [],
  );
  const [updatedVisibleColumns, updateVisibleColumns] =
    useState<string[]>(visibleColumns);

  const makeFiltersActive = () => {
    onFilterSave({
      filters: { objectTypes: updatedObjectTypes },
      columnVisibility: convertCheckedColumnsToVisibilityState(
        updatedVisibleColumns,
        columns.map(({ value }) => value),
      ),
      searchType: searchType.value,
    });
  };

  const resetAllFilters = () => {
    objectTypesWithConfig &&
      updateObjectTypes(
        objectTypesWithConfig.map(({ objectType }) => objectType),
      );
    updateVisibleColumns(columns.map(({ value }) => value));
  };

  const objectTypeOptions = useMemo(
    () =>
      createCheckboxOptions(
        objectTypesWithConfig
          ?.map(({ objectType, config }) => ({
            label: config?.objectTypeDisplayName || objectType,
            value: objectType,
          }))
          .sort(({ label: labelA }, { label: labelB }) =>
            labelA
              .toLocaleUpperCase()
              .localeCompare(labelB.toLocaleUpperCase()),
          ) || [],
        updatedObjectTypes,
      ),
    [objectTypesWithConfig, updatedObjectTypes],
  );

  const columnOptions = useMemo(
    () =>
      createCheckboxOptions(
        columns.map(({ label, value }) => ({ label: label || value, value })),
        updatedVisibleColumns,
      ),
    [columns, updatedVisibleColumns],
  );

  return (
    <div className="relative flex max-h-[60vh] w-full flex-col rounded bg-white py-2 text-xs shadow-lg shadow-manatee-500 md:max-h-96 xl:max-h-[28rem]">
      <div className="absolute right-5 top-2 z-20">
        <DisplayGraphQLQuery
          label="Content Library Search"
          query={graphqlQuery.query}
          variables={graphqlQuery.variables}
          headers={graphqlQuery.headers}
        />
      </div>
      <div className="relative flex-grow overflow-scroll border-none p-2 px-4 [&>section]:border-b-2 [&>section]:border-b-manatee-100 [&>section]:pb-3 [&>section]:pt-3 first:[&>section]:pt-0 last:[&>section]:border-none last:[&>section]:pb-0">
        <RadioGroup
          label="Lookup type"
          options={searchTypeOptions}
          selected={searchType}
          as="section"
          onChange={updateSearchType}
        />
        <CheckboxGrid
          label="Object type"
          withToggleAll
          options={objectTypeOptions}
          checkedOptions={updatedObjectTypes}
          onChange={(checkedOptions) => {
            updateObjectTypes(checkedOptions);
          }}
        />
        <CheckboxGrid
          label="Columns"
          withToggleAll
          options={columnOptions}
          checkedOptions={updatedVisibleColumns}
          onChange={(checkedOptions) => {
            updateVisibleColumns(checkedOptions);
          }}
        />
      </div>
      <div className="flex w-full justify-end space-x-4 px-4 pt-2">
        <Button variant="ghost" onClick={resetAllFilters}>
          Reset
        </Button>
        <Button
          variant="primary"
          onClick={makeFiltersActive}
          disabled={
            updatedObjectTypes.length === 0 ||
            updatedVisibleColumns.length === 0
          }
        >
          Apply
        </Button>
      </div>
    </div>
  );
};
