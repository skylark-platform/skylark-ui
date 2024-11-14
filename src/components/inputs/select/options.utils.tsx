import { ObjectTypesConfigObject } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectMeta } from "src/interfaces/skylark";

import { SelectOption } from "./select.component";

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

export const createObjectContentSortFieldOptions = (
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
