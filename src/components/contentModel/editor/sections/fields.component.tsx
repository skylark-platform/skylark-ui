import { Reorder } from "framer-motion";
import { useCallback } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { FiPlus } from "react-icons/fi";

import {
  AddNewButton,
  ObjectTypeFieldInput,
} from "src/components/contentModel/editor/contentModelRowInput.component";
import {
  InputFieldWithFieldConfig,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfig,
  NormalizedObjectField,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

import {
  ContentModelEditorForm,
  createFieldSections,
  FieldHeader,
  FieldType,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
} from "./common.component";

interface FieldsSectionProps {
  form: UseFormReturn<ContentModelEditorForm>;
  objectMeta: SkylarkObjectMeta;
  isEditingSchema: boolean;
}

const FieldSection = ({
  form,
  title,
  type,
  inputFields,
  objectMeta,
  isEditingSchema,
}: {
  form: UseFormReturn<ContentModelEditorForm>;
  title: string;
  type: FieldType;
  inputFields: InputFieldWithFieldConfig[];
  objectMeta: SkylarkObjectMeta;
  isEditingSchema: boolean;
}) => {
  const values = form.watch(`objectTypes.${objectMeta.name}.fields.${type}`);

  const fields = values
    ? Object.values(values)
    : inputFields.map(({ field }) => field);

  const addField = () => {
    const newFieldNum = fields.length;

    form.setValue(
      `objectTypes.${objectMeta.name}.fields.${type}.${newFieldNum}`,
      {
        name: `${type}_field_${newFieldNum + 1}`,
        originalType: "String",
        type: "string",
        isList: false,
        isRequired: false,
        isNew: true,
      },
      {
        shouldDirty: true,
      },
    );
  };

  return (
    <div className="mt-4 mb-10 text-xs md:text-sm">
      <h4 className="mt-4 mb-2 text-base md:text-lg font-medium">{title}</h4>
      <div className="grid grid-cols-7 gap-4 text-manatee-400 font-normal text-sm">
        <FieldHeader className="col-span-2 pl-5">Name</FieldHeader>
        <FieldHeader className="col-span-2" tooltip="The GraphQL type">
          Type
        </FieldHeader>
        <FieldHeader className="col-span-2">Enum</FieldHeader>
        <FieldHeader tooltip="When creating an object of this type, this field will be required to be added.">
          Required
        </FieldHeader>
      </div>
      {fields.map((field, index) => {
        return (
          <Controller
            key={`objectTypes.${objectMeta.name}.fields.${type}.${index}`}
            name={`objectTypes.${objectMeta.name}.fields.${type}.${index}`}
            control={form.control}
            render={({ field: hookField }) => {
              return hookField.value.isNew && hookField.value.isDeleted ? (
                <></>
              ) : (
                <ObjectTypeFieldInput
                  field={hookField.value}
                  showInput={isEditingSchema && !hookField.value.isDeleted}
                  objectMeta={objectMeta}
                  onChange={(updatedField) => hookField.onChange(updatedField)}
                  onDelete={() => {
                    const val = hookField.value;
                    hookField.onChange({
                      ...val,
                      isDeleted: !Boolean(val.isDeleted),
                    });
                  }}
                  allowModifyName={hookField.value?.isNew}
                  isDeleted={hookField.value.isDeleted}
                  isNew={hookField.value.isNew}
                />
              );
            }}
          />
        );
      })}
      {type !== "system" && isEditingSchema && (
        <AddNewButton text={`Add ${title} field`} onClick={addField} />
      )}
    </div>
  );
};

export const FieldsSection = ({
  objectMeta,
  form,
  isEditingSchema,
}: FieldsSectionProps) => {
  const fieldSections = createFieldSections(objectMeta);

  return (
    <SectionWrapper data-testid="fields-editor">
      <SectionHeader>Fields</SectionHeader>
      <SectionDescription>
        Only creating and deleting fields is currently supported.
      </SectionDescription>
      {/* TODO add Skeleton here with hardcoded headings as sections headers can be filtered out when no fields exist */}
      {Object.entries(fieldSections).map(([id, { title, type, fields }]) => (
        <FieldSection
          key={id}
          title={title}
          type={type}
          form={form}
          inputFields={fields}
          objectMeta={objectMeta}
          isEditingSchema={isEditingSchema}
        />
      ))}
    </SectionWrapper>
  );
};
