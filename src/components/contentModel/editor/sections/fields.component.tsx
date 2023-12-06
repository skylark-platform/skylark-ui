import { Reorder } from "framer-motion";
import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";

import { ObjectTypeFieldInput } from "src/components/contentModel/editor/contentModelRowInput.component";
import {
  InputFieldWithFieldConfig,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfig,
} from "src/interfaces/skylark";

import {
  ContentModelEditorForm,
  FieldHeader,
  FieldSectionID,
  SectionHeader,
  SectionWrapper,
} from "./common.component";

interface FieldsSectionProps {
  form: UseFormReturn<ContentModelEditorForm>;
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
}

const FieldSection = ({
  title,
  fields,
  objectMeta,
  objectConfig,
  disableReorder,
  primaryField,
  onChange,
  onPrimaryFieldChange,
}: {
  title: string;
  fields: InputFieldWithFieldConfig[];
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
  disableReorder?: boolean;
  primaryField?: string | null;
  onChange: (fields: InputFieldWithFieldConfig[]) => void;
  onPrimaryFieldChange: (field: string) => void;
}) => {
  const handleChange = useCallback(
    (updatedFieldWithConfig: InputFieldWithFieldConfig) => {
      const updatedFields = fields.map((fieldWithConfig) => {
        if (fieldWithConfig.field.name === updatedFieldWithConfig.field.name) {
          return {
            ...fieldWithConfig,
            ...updatedFieldWithConfig,
          };
        }
        return fieldWithConfig;
      });

      onChange(updatedFields);
    },
    [fields, onChange],
  );

  return (
    <div className="mt-4 mb-10">
      <h4 className="mt-4 mb-2 text-lg font-medium">{title}</h4>
      <div className="grid grid-cols-7 gap-4 text-manatee-400 font-normal text-sm">
        <FieldHeader className="col-span-2">Name</FieldHeader>
        <FieldHeader className="col-span-2" tooltip="The GraphQL type">
          Type
        </FieldHeader>
        <FieldHeader className="col-span-2">Enum / UI type</FieldHeader>
        <FieldHeader tooltip="When creating an object of this type, this field will be required to be added.">
          Required
        </FieldHeader>
        {/* <FieldHeader tooltip={uiDisplayFieldTooltip}>
          UI Display field
        </FieldHeader> */}
      </div>
      <Reorder.Group onReorder={onChange} values={fields}>
        {fields.map((fieldWithConfig) => {
          const fieldName = fieldWithConfig.field.name;
          return (
            <ObjectTypeFieldInput
              key={`${objectMeta.name}-${fieldName}`}
              fieldWithConfig={fieldWithConfig}
              objectMeta={objectMeta}
              disableReorder={disableReorder}
              isPrimaryField={
                primaryField
                  ? primaryField === fieldName
                  : objectConfig?.primaryField === fieldName
              }
              onChange={handleChange}
              onPrimaryFieldCheckedChange={(checked) =>
                onPrimaryFieldChange(checked ? fieldName : "")
              }
            />
          );
        })}
      </Reorder.Group>
    </div>
  );
};

export const FieldsSection = ({
  objectMeta,
  form,
  objectConfig,
}: FieldsSectionProps) => {
  const onFieldChange = useCallback(
    (id: FieldSectionID, reorderedFields: InputFieldWithFieldConfig[]) => {
      form.setValue(`fieldSections.${id}.fields`, reorderedFields, {
        shouldDirty: true,
      });
    },
    [form],
  );

  const fieldSections = form.watch("fieldSections");
  const primaryField = form.watch("uiConfig.primaryField");

  return (
    <SectionWrapper data-testid="fields-editor">
      <SectionHeader>Fields</SectionHeader>
      {/* TODO add Skeleton here with hardcoded headings as sections headers can be filtered out when no fields exist */}
      {Object.entries(fieldSections).map(([id, { title, fields }]) => (
        <FieldSection
          key={id}
          title={title}
          fields={fields}
          objectMeta={objectMeta}
          objectConfig={objectConfig}
          disableReorder={id === "system"}
          primaryField={primaryField}
          onChange={(fieldsWithConfig) =>
            onFieldChange(id as FieldSectionID, fieldsWithConfig)
          }
          onPrimaryFieldChange={(field) =>
            form.setValue("uiConfig.primaryField", field, { shouldDirty: true })
          }
        />
      ))}
    </SectionWrapper>
  );
};
