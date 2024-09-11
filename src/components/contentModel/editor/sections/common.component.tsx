import clsx from "clsx";
import { ReactNode } from "react";

import { InfoTooltip } from "src/components/tooltip/tooltip.component";
import { SYSTEM_FIELDS } from "src/constants/skylark";
import {
  InputFieldWithFieldConfig,
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectTypeRelationshipConfiguration,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";

export type FieldType = "system" | "translatable" | "global";

export type FieldSectionObject = Record<
  FieldType,
  { title: string; type: FieldType; fields: InputFieldWithFieldConfig[] }
>;

export interface ContentModelEditorForm {
  objectTypes: Record<
    string,
    {
      fields: Record<
        FieldType,
        (NormalizedObjectField & { isNew?: boolean; isDeleted?: boolean })[]
      >;
      relationships: (SkylarkObjectRelationship & {
        isNew?: boolean;
        isDeleted?: boolean;
      })[];
    }
  >;
  relationshipConfig?: ParsedSkylarkObjectTypeRelationshipConfiguration;
}

export interface UIConfigForm {
  fieldSections: FieldSectionObject;
  objectTypeDisplayName: string;
  primaryField: string | undefined | null;
  colour: string | undefined | null;
}

export const uiDisplayFieldTooltip =
  "A config property that instructs the UI which field it should use when displaying an object on listing pages.";

export const SectionWrapper = (props: { children: ReactNode }) => (
  <section {...props} className="my-10" />
);

export const SectionHeader = ({ children }: { children: ReactNode }) => (
  <h3 className="text-xl mb-1">{children}</h3>
);

export const SectionDescription = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-manatee-500 mb-2">{children}</p>
);

export const FieldHeader = ({
  children,
  className,
  tooltip,
}: {
  children: ReactNode;
  className?: string;
  tooltip?: ReactNode;
}) => (
  <div className={clsx("flex items-center whitespace-pre", className)}>
    <p>{children}</p>
    {tooltip && <InfoTooltip tooltip={tooltip} />}
  </div>
);

const combineInputAndGetFields = (
  inputFields: NormalizedObjectField[],
  getFields: NormalizedObjectField[],
): NormalizedObjectField[] => {
  // Some fields are not in input fields but we need to display them anyway, e.g. UID
  const inputFieldNames = inputFields.map(({ name }) => name);
  const missingInputFields = getFields.filter(
    ({ name }) => !inputFieldNames.includes(name),
  );

  return [...inputFields, ...missingInputFields];
};

const combineFieldAndFieldConfigAndSortByConfigPostion = (
  fields: NormalizedObjectField[],
  objectFieldConfig?: ParsedSkylarkObjectConfig,
): InputFieldWithFieldConfig[] => {
  const inputFieldsWithFieldConfig = fields
    .map((field) => {
      const config = objectFieldConfig?.fieldConfig?.find(
        ({ name }) => name === field.name,
      );

      return {
        field,
        config,
      };
    })
    .sort(({ config: configA }, { config: configB }) =>
      (configA?.position ?? Infinity) > (configB?.position ?? Infinity)
        ? 1
        : -1,
    );

  return inputFieldsWithFieldConfig;
};

const splitNormailsedFieldsIntoSystemGlobalTranslatable = (
  fields: NormalizedObjectField[],
  objectMetaFieldConfig: SkylarkObjectMeta["fieldConfig"],
): Record<FieldType, NormalizedObjectField[]> => {
  const splitFields = fields.reduce(
    (prev, field) => {
      const fieldName = field.name;

      if (SYSTEM_FIELDS.includes(fieldName)) {
        return {
          ...prev,
          system: [...prev.system, field].sort(
            (a, b) =>
              SYSTEM_FIELDS.indexOf(a.name) - SYSTEM_FIELDS.indexOf(b.name),
          ),
        };
      }

      if (objectMetaFieldConfig.global.includes(fieldName)) {
        return {
          ...prev,
          global: [...prev.global, field],
        };
      }

      if (objectMetaFieldConfig.translatable.includes(fieldName)) {
        return {
          ...prev,
          translatable: [...prev.translatable, field],
        };
      }

      return prev;
    },
    {
      system: [] as NormalizedObjectField[],
      translatable: [] as NormalizedObjectField[],
      global: [] as NormalizedObjectField[],
    },
  );

  return splitFields;
};

export const splitFieldsIntoSystemGlobalTranslatable = (
  objectMeta: SkylarkObjectMeta,
) =>
  splitNormailsedFieldsIntoSystemGlobalTranslatable(
    combineInputAndGetFields(
      objectMeta.operations.create.inputs,
      objectMeta.fields,
    ),
    objectMeta.fieldConfig,
  );

export const createFieldSections = (
  objectMeta: SkylarkObjectMeta,
  objectFieldConfig?: ParsedSkylarkObjectConfig,
) => {
  const splitFields = splitFieldsIntoSystemGlobalTranslatable(objectMeta);

  const sections: FieldSectionObject = {
    system: {
      title: "System",
      type: "system",
      fields: combineFieldAndFieldConfigAndSortByConfigPostion(
        splitFields.system,
        objectFieldConfig,
      ),
    },
    translatable: {
      title: "Translatable",
      type: "translatable",
      fields: combineFieldAndFieldConfigAndSortByConfigPostion(
        splitFields.translatable,
        objectFieldConfig,
      ),
    },
    global: {
      title: "Global",
      type: "global",
      fields: combineFieldAndFieldConfigAndSortByConfigPostion(
        splitFields.global,
        objectFieldConfig,
      ),
    },
  };

  return sections;
};
