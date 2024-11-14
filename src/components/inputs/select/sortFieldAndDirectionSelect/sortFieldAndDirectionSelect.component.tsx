import clsx from "clsx";
import { useMemo } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select/select.component";
import {
  ObjectTypesConfigObject,
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectMeta,
  SkylarkObjectTypes,
  SkylarkOrderDirections,
} from "src/interfaces/skylark";

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

const createLabel = (
  allObjectTypes: string[],
  {
    objectTypes,
    name,
    translatable,
  }: { objectTypes: string[]; name: string; translatable: boolean },
) => {
  const objectTypesText =
    allObjectTypes.length === objectTypes.length
      ? ""
      : ` (${objectTypes.length} object types)`;
  const translatableText = translatable ? " (translatable)" : "";

  return `"${name}"${objectTypesText}`;
};

const createObjectContentSortFieldOptions = (
  allObjectsMeta: SkylarkObjectMeta[] | null,
  objectTypes: string[],
  objectTypesConfig?: ObjectTypesConfigObject,
  manualSortLabel?: string,
): SelectOption<"__manual" | string>[] => {
  if (!allObjectsMeta) {
    return [];
  }

  const sortedByOptions = Object.entries(
    allObjectsMeta
      .filter(({ name }) => objectTypes.includes(name))
      .reduce(
        (prev, objectMeta) => {
          const name =
            objectTypesConfig?.[objectMeta.name]?.objectTypeDisplayName ||
            objectMeta.name;

          const globalObj = objectMeta.fieldConfig.global.reduce(
            (p, field) => ({
              ...p,
              [field]: {
                name: field,
                objectTypes: [...(p?.[field]?.objectTypes || []), name],
                translatable: false,
              },
            }),
            prev,
          );

          const translatableObj = objectMeta.fieldConfig.translatable.reduce(
            (p, field) => ({
              ...p,
              [`t:${field}`]: {
                name: field,
                objectTypes: [...(p?.[`t:${field}`]?.objectTypes || []), name],
                translatable: true,
              },
            }),
            globalObj,
          );

          return translatableObj;
        },
        {} as Record<
          string,
          { objectTypes: string[]; name: string; translatable: boolean }
        >,
      ),
  )
    .sort((a, b) => b[1].objectTypes.length - a[1].objectTypes.length)
    .reduce((prevOptions, [sortField, value]) => {
      const option: SelectOption<string> = {
        value: sortField,
        label: createLabel(objectTypes, value),
        infoTooltip:
          objectTypes.length !== value.objectTypes.length ? (
            <div>
              <p className="mb-1">
                Object types without this field will be pushed to the bottom.
              </p>
              <p>We recommend against using this field.</p>
            </div>
          ) : null,
      };
      return [...prevOptions, option];
    }, [] as SelectOption<string>[]);

  return [
    { label: manualSortLabel || "Manual sort", value: "__manual" },
    ...sortedByOptions,
  ];
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
        className={clsx(variant === "pill" && "text-manatee-600 w-36")}
        optionsClassName="w-72"
        selected={values.sortField || ""}
        options={sortFieldSelectOptions}
        renderInPortal
        searchable={false}
        floatingPosition="left-end"
        onChange={(sortField) => onChangeWrapper({ sortField })}
        aria-label="Sort field"
      />
      {!hideDirectionSelect && (
        <Select
          variant={variant}
          placeholder="ASC"
          className={clsx(variant === "pill" && "text-manatee-600 w-20")}
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
