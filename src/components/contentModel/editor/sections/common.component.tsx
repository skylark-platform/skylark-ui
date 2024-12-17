import clsx from "clsx";
import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

import { InfoTooltip } from "src/components/tooltip/tooltip.component";
import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectConfigFieldConfig,
  ParsedSkylarkObjectTypeRelationshipConfiguration,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  SkylarkObjectMeta,
  SkylarkObjectMetaRelationship,
  SkylarkObjectRelationship,
  SkylarkObjectType,
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
} & (
  | ({ type: "relationship" } & SkylarkObjectMetaRelationship)
  | Omit<NormalizedObjectField, "name">
);

export interface ContentModelEditorFormObjectTypeUiConfig {
  objectTypeDisplayName: string;
  primaryField: string | undefined | null;
  colour: string | undefined | null;
  fieldConfigs: Record<
    string,
    Omit<ParsedSkylarkObjectConfigFieldConfig, "name" | "position">
  >;
  fieldOrder: string[];
}

export interface ContentModelEditorForm {
  objectTypeNames: string[];
  setObjectTypeNames: string[];
  objectTypes: Record<
    SkylarkObjectType,
    {
      fields: ContentModelEditorFormObjectTypeField[];
      uiConfig: ContentModelEditorFormObjectTypeUiConfig;
      relationshipConfigs: ParsedSkylarkObjectTypeRelationshipConfigurations;
      isNew?: boolean;
      isSet: SkylarkObjectMeta["isSet"];
      isBuiltIn: SkylarkObjectMeta["isBuiltIn"];

      // Should use fieldOrder instead of attaching it to fields so that relationships can be mixed in to the list easily?
      // fieldOrder: string[];
    }
  >;
}

export interface ContentModelSectionStatuses {
  schema: boolean;
  uiConfig: boolean;
  relationshipConfig: boolean;
}

export const uiDisplayFieldTooltip =
  "A config property that instructs the UI which field it should use when displaying an object on listing pages.";

export const SectionWrapper = (props: { children: ReactNode }) => (
  <section {...props} className="mb-6 lg:mb-10" />
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

export const sortSystemFieldsFirst = (fieldA: string, fieldB: string) => {
  // Hardcode some system fields to always be in the same place
  if (fieldA == SkylarkSystemField.UID) return -1;
  if (fieldB == SkylarkSystemField.UID) return 1;

  if (fieldA == SkylarkSystemField.ExternalID) return -1;
  if (fieldB == SkylarkSystemField.ExternalID) return 1;

  if (fieldA == SkylarkSystemField.Type) return -1;
  if (fieldB == SkylarkSystemField.Type) return 1;

  return 0;
};

export const combineFieldRelationshipsAndFieldConfig = (
  fields: NormalizedObjectField[],
  relationships: SkylarkObjectMetaRelationship[],
  // relationshipsConfig?: ParsedSkylarkObjectTypeRelationshipConfigurations,
): ContentModelEditorFormObjectTypeField[] => {
  // console.log("com", relationshipsConfig, relationshipsConfig?.["logo"]);

  const fieldsWithConfig: ContentModelEditorFormObjectTypeField[] = fields.map(
    (field) => {
      return {
        ...field,
        // fieldConfig: fieldConfig || null,
      };
    },
  );

  const relationshipsWithConfig: ContentModelEditorFormObjectTypeField[] =
    relationships.map((relationship): ContentModelEditorFormObjectTypeField => {
      // const relationshipConfig = relationshipsConfig?.[
      //   relationship.relationshipName
      // ] || {
      //   defaultSortField: null,
      //   inheritAvailability: false,
      // };

      return {
        ...relationship,
        name: relationship.relationshipName,
        type: "relationship",
        // fieldConfig: fieldConfig || null,
        // relationshipConfig,
      };
    });

  const fieldsAndRelationships = [
    ...fieldsWithConfig,
    ...relationshipsWithConfig,
  ];

  return fieldsAndRelationships;
};

export const calculateContentModelUpdateTypes = (
  form: UseFormReturn<ContentModelEditorForm>,
): ContentModelSectionStatuses => {
  const defaultUpdateTypes = {
    schema: false,
    uiConfig: false,
    relationshipConfig: false,
  };
  return form.formState.dirtyFields.objectTypes
    ? Object.values(form.formState.dirtyFields.objectTypes).reduce(
        (prev, objectType) => {
          if (typeof objectType === "boolean" && objectType) {
            return {
              ...prev,
              schema: true,
            };
          }

          const { fields, uiConfig } = objectType;

          return {
            ...prev,
            schema: fields ? true : false,
            uiConfig: uiConfig ? true : false,
            relationshipConfig: false,
          };
        },
        defaultUpdateTypes,
      )
    : defaultUpdateTypes;
};
