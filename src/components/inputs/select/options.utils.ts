import { ObjectTypesConfigObject } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectMeta } from "src/interfaces/skylark";

import { SelectOption } from "./select.component";

export const createObjectContentSortFieldOptions = (
  allObjectsMeta: SkylarkObjectMeta[] | null,
  objectTypes: string[],
  objectTypesConfig?: ObjectTypesConfigObject,
): SelectOption<"manual" | string>[] => {
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

          const translatableObj = objectMeta.fieldConfig.global.reduce(
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
  ).reduce((prevOptions, [sortField, { objectTypes, name, translatable }]) => {
    const option: SelectOption<string> = {
      value: sortField,
      label: `"${name}" on ${objectTypes.length === objectTypes.length ? "all" : objectTypes.length} object types ${translatable ? "(translatable)" : ""}`,
    };
    return [...prevOptions, option];
  }, [] as SelectOption<string>[]);

  return [{ label: "Manual sort", value: "manual" }, ...sortedByOptions];
};
