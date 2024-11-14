import clsx from "clsx";
import { useMemo } from "react";

import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectTypes,
  SkylarkOrderDirections,
} from "src/interfaces/skylark";

import { createObjectContentSortFieldOptions } from "../options.utils";
import { Select, SelectProps } from "../select.component";

type Values = {
  sortField: string;
  sortDirection?: SkylarkOrderDirections;
};

type SortFieldAndDirectionSelectProps = Omit<
  SelectProps<Values>,
  "value" | "options" | "placeholder"
> & {
  objectTypes: SkylarkObjectTypes;
  values: Values;
  hideDirectionSelect?: boolean;
  manualSortLabel?: string;
  onChange: (v: Values) => void;
  containerClassName?: string;
};

export const SortFieldAndDirectionSelect = ({
  objectTypes,
  values,
  containerClassName,
  variant,
  hideDirectionSelect,
  manualSortLabel,
  onChange,
}: SortFieldAndDirectionSelectProps) => {
  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const { objectTypesConfig } = useSkylarkObjectTypesWithConfig();

  const sortFieldSelectOptions = useMemo(
    () =>
      createObjectContentSortFieldOptions(
        allObjectsMeta,
        objectTypes,
        objectTypesConfig,
        manualSortLabel,
      ),
    [allObjectsMeta, objectTypes, objectTypesConfig],
  );

  const onChangeWrapper = (newValues: Partial<Values>) => {
    onChange({
      ...values,
      ...newValues,
    });
  };

  return (
    <div className={clsx("flex", containerClassName)}>
      <Select
        variant={variant}
        placeholder="Unsorted"
        className="text-manatee-600 w-36"
        optionsClassName="w-72"
        selected={values.sortField || ""}
        options={sortFieldSelectOptions}
        renderInPortal
        searchable={false}
        floatingPosition="left-end"
        onChange={(sortField) => onChangeWrapper({ sortField })}
      />
      {!hideDirectionSelect && (
        <Select
          variant={variant}
          placeholder="ASC"
          className="text-manatee-600 w-20"
          selected={values.sortDirection || SkylarkOrderDirections.ASC}
          options={[
            { label: "ASC", value: SkylarkOrderDirections.ASC },
            { label: "DESC", value: SkylarkOrderDirections.DESC },
          ]}
          renderInPortal
          searchable={false}
          onChange={(sortDirection) => onChangeWrapper({ sortDirection })}
        />
      )}
    </div>
  );
};
