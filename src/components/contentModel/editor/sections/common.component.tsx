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

export type ContentModelEditorFormObjectTypeField = {
  name: string;
  isNew?: boolean;
  isDeleted?: boolean;
  fieldConfig: Omit<ParsedSkylarkObjectConfigFieldConfig, "name"> | null;
} & (
  | ({ type: "relationship" } & SkylarkObjectRelationship)
  | Omit<NormalizedObjectField, "name">
);

export type ContentModelEditorFormObjectTypeRelationship =
  SkylarkObjectRelationship & {
    isNew?: boolean;
    isDeleted?: boolean;
  };

export interface ContentModelEditorForm {
  objectTypes: Record<
    string,
    {
      fields: ContentModelEditorFormObjectTypeField[];
      // relationships: ContentModelEditorFormObjectTypeRelationship[];

      // Should use fieldOrder instead of attaching it to fields so that relationships can be mixed in to the list easily?
      // fieldOrder: string[];
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

export const combineFieldRelationshipsAndFieldConfigAndSortByConfigPostion = (
  fields: NormalizedObjectField[],
  relationships: SkylarkObjectRelationship[],
  objectFieldConfig?: ParsedSkylarkObjectConfig,
): ContentModelEditorFormObjectTypeField[] => {
  const fieldsWithConfig: ContentModelEditorFormObjectTypeField[] = fields.map(
    (field) => {
      const fieldConfig = objectFieldConfig?.fieldConfig?.find(
        ({ name }) => name === field.name,
      );

      return {
        ...field,
        fieldConfig: fieldConfig || null,
      };
    },
  );

  const relationshipsWithConfig: ContentModelEditorFormObjectTypeField[] =
    relationships.map((relationship): ContentModelEditorFormObjectTypeField => {
      const fieldConfig = objectFieldConfig?.fieldConfig?.find(
        ({ name }) => name === relationship.relationshipName,
      );

      return {
        ...relationship,
        name: relationship.relationshipName,
        type: "relationship",
        fieldConfig: fieldConfig || null,
      };
    });

  const sortedFieldsAndRelationships = [
    ...fieldsWithConfig,
    ...relationshipsWithConfig,
  ].sort((fieldA, fieldB) => {
    const systemFieldSorted = sortSystemFieldsFirst(fieldA, fieldB);

    if (systemFieldSorted !== 0) {
      return systemFieldSorted;
    }

    return (fieldA.fieldConfig?.position ?? Infinity) >
      (fieldB.fieldConfig?.position ?? Infinity)
      ? 1
      : -1;
  });

  return sortedFieldsAndRelationships;
};
