import clsx from "clsx";
import { ReactNode } from "react";

import { InfoTooltip } from "src/components/tooltip/tooltip.component";
import { SYSTEM_FIELDS } from "src/constants/skylark";
import {
  InputFieldWithFieldConfig,
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectConfigFieldConfig,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
  SkylarkSystemField,
} from "src/interfaces/skylark";

export type FieldType = "system" | "translatable" | "global";

export type FieldSectionObject = Record<
  FieldType,
  {
    title: string;
    type: FieldType;
    fields: ContentModelEditorFormObjectTypeField[];
  }
>;

export type ContentModelEditorFormObjectTypeField = NormalizedObjectField & {
  isNew?: boolean;
  isDeleted?: boolean;
  config: Omit<
    ParsedSkylarkObjectConfigFieldConfig,
    "position" | "name"
  > | null;
};

export interface ContentModelEditorForm {
  objectTypes: Record<
    string,
    {
      fields: ContentModelEditorFormObjectTypeField[];
      relationships: (SkylarkObjectRelationship & {
        isNew?: boolean;
        isDeleted?: boolean;
      })[];
    }
  >;
  // relationshipConfig?: ParsedSkylarkObjectTypeRelationshipConfigurations;
}

export interface UIConfigForm {
  // fieldSections: FieldSectionObject;
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

export const sortSystemFieldsFirst = (
  fieldA: ContentModelEditorFormObjectTypeField,
  fieldB: ContentModelEditorFormObjectTypeField,
) => {
  // Hardcode some system fields to always be in the same place
  if (fieldA.name == SkylarkSystemField.UID) return -1;
  if (fieldB.name == SkylarkSystemField.UID) return 1;

  if (fieldA.name == SkylarkSystemField.ExternalID) return -1;
  if (fieldB.name == SkylarkSystemField.ExternalID) return 1;

  if (fieldA.name == SkylarkSystemField.Type) return -1;
  if (fieldB.name == SkylarkSystemField.Type) return 1;

  return 0;
};

export const combineFieldAndFieldConfigAndSortByConfigPostion = (
  fields: NormalizedObjectField[],
  objectFieldConfig?: ParsedSkylarkObjectConfig,
): ContentModelEditorFormObjectTypeField[] => {
  const inputFieldsWithFieldConfig = fields
    .map((field) => {
      const config = objectFieldConfig?.fieldConfig?.find(
        ({ name }) => name === field.name,
      );

      return {
        ...field,
        config: config || null,
      };
    })
    .sort((fieldA, fieldB) => {
      const systemFieldSorted = sortSystemFieldsFirst(fieldA, fieldB);

      if (systemFieldSorted !== 0) {
        return systemFieldSorted;
      }

      // console.log({ fieldA, fieldB });

      return (fieldA.config?.position ?? Infinity) >
        (fieldB.config?.position ?? Infinity)
        ? 1
        : -1;
    });

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

const splitFieldsIntoSystemGlobalTranslatable = (
  objectMeta: SkylarkObjectMeta,
) =>
  splitNormailsedFieldsIntoSystemGlobalTranslatable(
    objectMeta.fields,
    objectMeta.fieldConfig,
  );

export const createFieldSections = (
  objectMeta: SkylarkObjectMeta,
  objectFieldConfig: ParsedSkylarkObjectConfig,
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
