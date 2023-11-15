import { VisibilityState } from "@tanstack/react-table";
import { DocumentNode } from "graphql";
import { useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { Button } from "src/components/button";
import {
  CheckboxGrid,
  CheckboxGridToggleAll,
  createCheckboxOptions,
} from "src/components/checkboxGrid/checkboxGrid.component";
import { RadioGroup } from "src/components/inputs/radioGroup/radioGroup.component";
import { Switch } from "src/components/inputs/switch/switch.component";
import { DisplayGraphQLQuery } from "src/components/modals";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SYSTEM_FIELDS } from "src/constants/skylark";
import { SearchFilters } from "src/hooks/useSearch";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import {
  sortObjectTypesWithConfig,
  useAllObjectsMeta,
} from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObjectConfig } from "src/interfaces/skylark";
import { sortFieldsByConfigPosition } from "src/lib/skylark/objects";

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

const FilterColumns = ({
  objectTypes,
  columns,
  updatedVisibleColumns,
  objectTypesWithConfig,
  updateVisibleColumns,
}: {
  columns: SearchFilterProps["columns"];
  updatedVisibleColumns: SearchFilterProps["visibleColumns"];
  objectTypes: string[];
  objectTypesWithConfig: SearchFilterProps["objectTypesWithConfig"];
  updateVisibleColumns: (arr: string[]) => void;
}) => {
  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const [sectionByObjectType, setSectionByObjectType] = useLocalStorage(
    LOCAL_STORAGE.search.columnFilterVariant,
    true,
  );

  const allColumnOptions = useMemo(
    () =>
      createCheckboxOptions(
        columns.map(({ label, value }) => ({ label: label || value, value })),
        updatedVisibleColumns,
      ),
    [columns, updatedVisibleColumns],
  );

  const { columnOptionsSplitByObjectType, commonFieldOptions } = useMemo(() => {
    const columnOptionsSplitByObjectType = allObjectsMeta
      ?.map((objectMeta) => {
        const config = objectTypesWithConfig.find(
          ({ objectType }) => objectType === objectMeta.name,
        )?.config;

        const options = createCheckboxOptions(
          objectMeta.fields
            .filter(({ name }) => !SYSTEM_FIELDS?.includes(name))
            .sort((a, b) =>
              sortFieldsByConfigPosition(a.name, b.name, config?.fieldConfig),
            )
            .map(({ name }) => {
              const columnField = columns.find(({ value }) => value === name);

              return {
                value: columnField?.value || name,
                label: columnField?.label || columnField?.value || name,
              };
            }),
          updatedVisibleColumns,
        );

        return {
          objectType: objectMeta.name,
          config,
          options,
        };
      })
      .sort(sortObjectTypesWithConfig);

    const allObjectFields =
      allObjectsMeta
        ?.map((objectMeta) => objectMeta.fields.map(({ name }) => name))
        .flatMap((arr) => arr) || [];
    const unassignedColumns = columns
      .filter(
        ({ value }) =>
          !allObjectFields.includes(value) || SYSTEM_FIELDS.includes(value),
      )
      .map(({ value, label }) => ({ value, label: label || value }));

    const commonFieldOptions = createCheckboxOptions(
      unassignedColumns || [],
      updatedVisibleColumns,
    );

    return {
      commonFieldOptions,
      columnOptionsSplitByObjectType,
    };
  }, [allObjectsMeta, columns, objectTypesWithConfig, updatedVisibleColumns]);

  return (
    <section>
      <div className="flex mb-2 text-manatee-600 justify-between">
        <h4 className="select-none font-semibold mr-2">Columns</h4>
        <div className="flex justify-center">
          <p className="select-none block mx-1">{`${
            sectionByObjectType ? "Separated by Object Type" : "All fields"
          }`}</p>
          <Switch
            enabled={sectionByObjectType}
            onChange={setSectionByObjectType}
            size="small"
          />
        </div>
      </div>
      {sectionByObjectType ? (
        <>
          <CheckboxGridToggleAll
            onChange={updateVisibleColumns}
            name={`sectioned-by-object-types-toggle-all`}
            options={allColumnOptions}
            checkedOptions={updatedVisibleColumns}
          />
          <div>
            <h4 className="mb-2 select-none text-manatee-500">
              System & Special Columns
            </h4>
            <CheckboxGrid
              label="special"
              hideLabel
              withToggleAll
              className="mt-2"
              options={commonFieldOptions}
              checkedOptions={updatedVisibleColumns}
              onChange={updateVisibleColumns}
            />
          </div>
          {columnOptionsSplitByObjectType
            ?.filter(({ objectType }) => objectTypes.includes(objectType))
            .map(({ objectType, config, options }) => (
              <div key={objectType} className="mt-2">
                <h4 className="mb-2 select-none text-manatee-500">
                  {config?.objectTypeDisplayName || objectType} fields
                </h4>
                <CheckboxGrid
                  label={objectType}
                  hideLabel
                  withToggleAll
                  options={options}
                  checkedOptions={updatedVisibleColumns}
                  onChange={updateVisibleColumns}
                />
              </div>
            ))}
        </>
      ) : (
        <CheckboxGrid
          label="all fields"
          hideLabel
          withToggleAll
          options={allColumnOptions}
          checkedOptions={updatedVisibleColumns}
          onChange={(checkedOptions) => {
            updateVisibleColumns(checkedOptions);
          }}
        />
      )}
    </section>
  );
};

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
    updateSearchType(searchTypeOptions[0]);
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
          as="section"
          withToggleAll
          options={objectTypeOptions}
          checkedOptions={updatedObjectTypes}
          onChange={(checkedOptions) => {
            updateObjectTypes(checkedOptions);
          }}
        />
        <FilterColumns
          objectTypes={updatedObjectTypes}
          objectTypesWithConfig={objectTypesWithConfig}
          columns={columns}
          updateVisibleColumns={updateVisibleColumns}
          updatedVisibleColumns={updatedVisibleColumns}
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
