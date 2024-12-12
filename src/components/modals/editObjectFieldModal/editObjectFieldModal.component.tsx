import React, { forwardRef, useRef } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";

import { Button } from "src/components/button";
import { ContentModelEditorFormObjectTypeField } from "src/components/contentModel/editor/sections/common.component";
import { Checkbox } from "src/components/inputs/checkbox";
import { TextInput } from "src/components/inputs/input";
import { ObjectTypeSelect, Select } from "src/components/inputs/select";
import { EnumSelect } from "src/components/inputs/select/enumSelect/enumSelect.component";
import {
  Modal,
  ModalDescription,
  ModalTitle,
} from "src/components/modals/base/modal";
import {
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { useSkylarkSchemaEnums } from "src/hooks/useSkylarkSchemaEnums";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  NormalizedObjectFieldType,
  SkylarkObjectConfigFieldType,
} from "src/interfaces/skylark";
import { parseObjectInputType } from "src/lib/skylark/parsers";

export type EditObjectFieldModalForm = {
  field: ContentModelEditorFormObjectTypeField;
};

interface EditObjectFieldModalProps {
  isOpen: boolean;
  initialValues?: { field: ContentModelEditorFormObjectTypeField };
  setIsOpen: (b: boolean) => void;
  onSubmit: (f: EditObjectFieldModalForm) => void;
}

const graphQLFields: (GQLScalars | "Enum" | "Relationship")[] = [
  "String",
  "Int",
  "Float",
  "Boolean",
  "ID",
  "AWSDate",
  "AWSDateTime",
  "AWSEmail",
  "AWSIPAddress",
  "AWSJSON",
  "AWSPhone",
  "AWSTime",
  "AWSTimestamp",
  "AWSURL",
  "Enum",
  "Relationship",
];

const objectConfigFieldTypes: SkylarkObjectConfigFieldType[] = [
  "STRING",
  "TEXTAREA",
  "WYSIWYG",
  "TIMEZONE",
  "COLOURPICKER",
];

const FieldFormFields = ({
  form,
  isEditModal,
}: {
  form: UseFormReturn<EditObjectFieldModalForm>;
  isEditModal: boolean;
}) => {
  const { control, watch, setValue } = form;

  const values = watch("field");

  return values?.type !== "relationship" ? (
    <>
      {values?.type === "enum" && (
        <Controller
          name="field.enumValues"
          control={control}
          render={({ field }) => {
            return (
              <EnumSelect
                label="Enum"
                labelVariant="form"
                selected={values.originalType}
                onChange={(val) => {
                  field.onChange(val.enumValues);

                  setValue("field.originalType", val.name as GQLScalars);
                }}
                variant={"primary"}
                placeholder={null}
                disabled={isEditModal}
              />
            );
          }}
        />
      )}
      <Controller
        name="field.isTranslatable"
        control={control}
        render={({ field }) => {
          return (
            <Checkbox
              name="translatable"
              checked={field.value}
              onCheckedChange={field.onChange}
              label="Translatable"
              disabled={isEditModal}
            />
          );
        }}
      />
      <Controller
        name="field.isRequired"
        control={control}
        render={({ field }) => {
          return (
            <Checkbox
              name="required"
              checked={field.value}
              onCheckedChange={field.onChange}
              label="Required"
              disabled={isEditModal}
            />
          );
        }}
      />
    </>
  ) : null;
};

const RelationshipFormFields = ({
  form,
  isEditModal,
}: {
  form: UseFormReturn<EditObjectFieldModalForm>;
  isEditModal: boolean;
}) => {
  const { watch, control } = form;

  const values = watch("field");

  return values?.type === "relationship" ? (
    <>
      <Controller
        name="field.objectType"
        control={control}
        rules={{ required: true }}
        render={({ field }) => {
          return (
            <ObjectTypeSelect
              label="Object type"
              labelVariant="form"
              selected={values.objectType}
              onChange={({ objectType }) => {
                field.onChange(objectType);
              }}
              variant={"primary"}
              placeholder={undefined}
              disabled={isEditModal}
            />
          );
        }}
      />
      <Controller
        name="field.reverseRelationshipName"
        control={control}
        rules={{ required: true }}
        render={({ field }) => {
          return (
            <TextInput
              label={`Relationship name on ${values.objectType ? `${values.objectType}` : "related Object Type"}`}
              value={field.value || ""}
              disabled={isEditModal}
              required
              onChange={(str) =>
                field.onChange(str.replaceAll(" ", "_").toLowerCase())
              }
            />
          );
        }}
      />
    </>
  ) : null;
};

const EditObjectFieldModalBody = forwardRef(
  ({
    initialValues,
    onSubmit,
    closeModal,
  }: Omit<EditObjectFieldModalProps, "isOpen" | "setIsOpen"> & {
    closeModal: () => void;
  }) => {
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const form = useForm<EditObjectFieldModalForm>({
      defaultValues: initialValues || {
        field: {
          type: "string",
          originalType: "String",
          isRequired: false,
          isTranslatable: false,
          isNew: true,
          isDeleted: false,
          isList: false,
        },
      },
    });

    const { handleSubmit, watch, control, formState, setValue } = form;

    const values = watch("field");

    const { enums } = useSkylarkSchemaEnums();

    const isEditModal = !!initialValues;

    const isRelationship = values?.type === "relationship";

    return (
      <>
        <ModalTitle>{`${isEditModal ? `Edit ${initialValues.field.name}` : "Add Field"}`}</ModalTitle>
        <ModalDescription>
          Fields can only be created or deleted. Editing only supported for
          field config. Fields can only be reordered on the active version.
        </ModalDescription>
        <form
          className="mt-8 flex w-full flex-col h-full justify-start"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="w-full h-full flex flex-grow gap-4 flex-col">
            <Controller
              name="field.name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <TextInput
                    label="Field name"
                    {...field}
                    disabled={isEditModal}
                    required
                    onChange={(str) =>
                      field.onChange(str.replaceAll(" ", "_").toLowerCase())
                    }
                  />
                );
              }}
            />
            <Controller
              name="field.type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <Select
                    label="Type"
                    labelVariant="form"
                    disabled={isEditModal}
                    options={graphQLFields.map((value) => ({
                      value,
                      label: value,
                    }))}
                    variant="primary"
                    placeholder=""
                    onChange={(value) => {
                      if (value === "Relationship") {
                        field.onChange("relationship");
                        return;
                      }

                      const parsedValue = graphQLFields.includes(
                        value as GQLScalars,
                      )
                        ? parseObjectInputType(value)
                        : (value as NormalizedObjectFieldType);

                      field.onChange(parsedValue);

                      const defaultEnum = enums?.[0];
                      setValue(
                        "field.originalType",
                        value === "Enum"
                          ? (defaultEnum?.name as GQLScalars)
                          : value,
                      );
                      if (value === "Enum") {
                        setValue(
                          "field.enumValues",
                          defaultEnum?.enumValues.map(({ name }) => name) || [],
                        );
                      }
                    }}
                    selected={
                      field.value === "relationship"
                        ? "Relationship"
                        : field.value === "enum"
                          ? "Enum"
                          : (values?.type !== "relationship" &&
                              values?.originalType) ||
                            "String"
                    }
                  />
                );
              }}
            />

            {isRelationship ? (
              <RelationshipFormFields form={form} isEditModal={isEditModal} />
            ) : (
              <FieldFormFields form={form} isEditModal={isEditModal} />
            )}

            {["string"].includes(values?.type) && (
              <div className="flex flex-col gap-2">
                <PanelSeparator className="mb-4" />
                <PanelSectionTitle text="Field config" />
                {values?.type === "string" && (
                  <Controller
                    name="field.fieldConfig.fieldType"
                    control={control}
                    render={({ field }) => {
                      return (
                        <Select
                          label="Field type"
                          labelVariant="form"
                          className="w-full"
                          options={(objectConfigFieldTypes as string[]).map(
                            (value) => ({
                              value,
                              label: value,
                            }),
                          )}
                          variant="primary"
                          selected={field.value}
                          placeholder=""
                          onChange={field.onChange}
                          onValueClear={() => field.onChange(null)}
                        />
                      );
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4 self-end">
            <div className="space-x-2 flex">
              <Button
                ref={submitButtonRef}
                variant="primary"
                type="submit"
                disabled={Object.keys(formState.dirtyFields).length === 0}
                success
              >
                {isEditModal ? "Update" : "Add"}
              </Button>
              <Button
                variant="outline"
                type="button"
                danger
                onClick={closeModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </>
    );
  },
);
EditObjectFieldModalBody.displayName = "EditObjectFieldModalBody";

export const EditObjectFieldModal = ({
  isOpen,
  setIsOpen,
  ...props
}: EditObjectFieldModalProps) => {
  const objectTypeSelectRef = useRef(null);

  return (
    <Modal
      initialFocus={objectTypeSelectRef}
      title={null}
      isOpen={isOpen}
      closeModal={() => setIsOpen(false)}
      data-testid="edit-object-field-modal"
      size="medium"
      growHeight
    >
      {isOpen && (
        <EditObjectFieldModalBody
          {...props}
          ref={objectTypeSelectRef}
          closeModal={() => setIsOpen(false)}
        />
      )}
    </Modal>
  );
};
