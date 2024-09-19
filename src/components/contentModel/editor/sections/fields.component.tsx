import clsx from "clsx";
import { DragControls, Reorder, useDragControls } from "framer-motion";
import { Fragment, ReactNode, useCallback, useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { FiCheck, FiInfo, FiPlus, FiRotateCcw, FiTrash2 } from "react-icons/fi";

import { Button } from "src/components/button";
import {
  AddNewButton,
  ObjectTypeFieldInput,
} from "src/components/contentModel/editor/contentModelRowInput.component";
import {
  EditObjectFieldModal,
  EditObjectFieldModalForm,
} from "src/components/modals/editObjectFieldModal/editObjectFieldModal.component";
import { InfoTooltip, Tooltip } from "src/components/tooltip/tooltip.component";
import { useSkylarkSchemaEnums } from "src/hooks/useSkylarkSchemaEnums";
import {
  InputFieldWithFieldConfig,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfig,
  NormalizedObjectField,
  SkylarkSystemField,
  ParsedSkylarkObjectConfigFieldConfig,
} from "src/interfaces/skylark";
import { hasProperty, isSkylarkObjectType } from "src/lib/utils";

import {
  combineFieldAndFieldConfigAndSortByConfigPostion,
  ContentModelEditorForm,
  ContentModelEditorFormObjectTypeField,
  createFieldSections,
  FieldHeader,
  FieldType,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
  sortSystemFieldsFirst,
} from "./common.component";

interface FieldsSectionProps {
  form: UseFormReturn<ContentModelEditorForm>;
  objectMeta: SkylarkObjectMeta;
}

const FieldNameTooltip = ({ field }: { field: string }) => {
  let tooltip = null;

  if (field === SkylarkSystemField.UID) {
    tooltip = (
      <div className="">
        <p>Auto-generated field when an object is created.</p>
        <p>Can be used to fetch an object. See more here:</p>
      </div>
    );
  }

  if (field === SkylarkSystemField.ExternalID) {
    tooltip = (
      <div className="">
        <p>Special field, you can look stuff up using this</p>
        <p>Can be used to fetch an object. See more here:</p>
      </div>
    );
  }

  if (field === SkylarkSystemField.Type) {
    tooltip = (
      <div className="">
        <p>Special field, wondering why this is displayed in System Fields?</p>
        <p>When the field `type` is used, you can filter search using it</p>
      </div>
    );
  }

  if (field === SkylarkSystemField.Slug) {
    tooltip = (
      <div className="">
        <p>Special field, always added to an object as translatable metadata</p>
        <p>Might have use in the future...</p>
      </div>
    );
  }

  return tooltip ? <InfoTooltip tooltip={tooltip} /> : null;
};

interface FieldProps {
  field: ContentModelEditorFormObjectTypeField;
  isDeleted?: boolean;
  isNew?: boolean;
  onDelete: (field: NormalizedObjectField) => void;
  onEdit: () => void;
}

const Field = ({ field, isDeleted, isNew, onDelete, onEdit }: FieldProps) => {
  const dragControls = useDragControls();

  const isEnum = !!field?.enumValues;

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={dragControls}
      // as="div"
      // className="relative"
      // className="my-2 bg-white z-30 border shadow border-manatee-300 rounded-lg items-center h-14 px-2 grid gap-4 grid-cols-3"
    >
      <div
        className={clsx(
          "my-2 border relative rounded-lg items-center h-14 px-2 grid gap-4",
          "grid-cols-7",
          isDeleted
            ? "bg-error/10 text-manatee-300 border-error/15"
            : "bg-white shadow border-manatee-300",
        )}
      >
        {!(
          [
            SkylarkSystemField.UID,
            SkylarkSystemField.ExternalID,
            SkylarkSystemField.Type,
          ] as string[]
        ).includes(field.name) && (
          <div
            onPointerDown={(event) => {
              dragControls.start(event);
              event.preventDefault();
            }}
            className="absolute left-1 h-full w-5 mr-1 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat opacity-60 cursor-grab"
          />
        )}
        <div
          className={clsx(
            "flex justify-start h-full items-center col-span-2 pl-5",
          )}
        >
          <p>{field.name}</p>
          <FieldNameTooltip field={field.name} />
        </div>
        <div className="flex justify-start items-center h-full col-span-2">
          <div className="flex">
            <p>{isEnum ? "Enum" : field.originalType}</p>
            {isEnum && (
              <>
                <Tooltip
                  tooltip={
                    <>
                      <ul>
                        {field.enumValues?.map((value) => (
                          <li key={value}>{value}</li>
                        ))}
                      </ul>
                    </>
                  }
                >
                  <p className="ml-2 flex justify-center items-center text-manatee-500">
                    {`(${field.originalType}`}
                    <FiInfo className="text-sm ml-1" />
                    {`)`}
                  </p>
                </Tooltip>
              </>
            )}
            {field.config?.fieldType && field.type === "string" && (
              <p className="ml-2 flex justify-center items-center text-manatee-500">
                {`(${field.config.fieldType}`}
                {/* <FiInfo className="text-sm ml-1" /> */}
                {`)`}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-start items-center col-span-1">
          {field.isTranslatable ? (
            <FiCheck className="text-success text-xl" />
          ) : (
            "-"
          )}
        </div>
        <div className="flex justify-start items-center col-span-1">
          {field.isRequired ? (
            <FiCheck className="text-success text-xl" />
          ) : (
            "-"
          )}
        </div>
        <div className="flex justify-center items-center col-span-1">
          <Button variant="form" onClick={() => onEdit()}>
            Edit
          </Button>
          {isDeleted && !isNew ? (
            <Button
              variant="ghost"
              Icon={<FiRotateCcw className="text-base" />}
              onClick={() => onDelete(field)}
            />
          ) : (
            <Button
              variant="ghost"
              Icon={<FiTrash2 className="text-base text-error" />}
              onClick={() => onDelete(field)}
            />
          )}
        </div>
      </div>
    </Reorder.Item>
  );
};

export const FieldsSection = ({ objectMeta, form }: FieldsSectionProps) => {
  // const fieldSections = createFieldSections(objectMeta);

  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    initialData: { field: ContentModelEditorFormObjectTypeField } | null;
  }>({ isOpen: false, initialData: null });

  const addField = () => {
    setEditModalState({ isOpen: true, initialData: null });
    // const newFieldNum = objectMeta.fields.length;

    // form.setValue(
    //   `objectTypes.${objectMeta.name}.fields.${type}.${newFieldNum}`,
    //   {
    //     name: `${type}_field_${newFieldNum + 1}`,
    //     originalType: "String",
    //     type: "string",
    //     isList: false,
    //     isRequired: false,
    //     isNew: true,
    //   },
    //   {
    //     shouldDirty: true,
    //   },
    // );
  };

  const deleteField = (
    field: ContentModelEditorFormObjectTypeField,
    index: number,
  ) => {
    if (field.isNew) {
      const currentFields = form.getValues(
        `objectTypes.${objectMeta.name}.fields`,
      );
      currentFields.splice(index, 1);
      form.setValue(`objectTypes.${objectMeta.name}.fields`, currentFields);
    } else {
      form.setValue(`objectTypes.${objectMeta.name}.fields.${index}`, {
        ...field,
        isDeleted: true,
      });
    }
  };

  const onEditFieldModalSubmit = ({ field }: EditObjectFieldModalForm) => {
    console.log("onEditFieldModalSubmit", { field });
    const prevField = editModalState.initialData?.field;
    const prevName = prevField?.name;
    const isNew = !prevName;
    const prevValues = form.getValues(`objectTypes.${objectMeta.name}.fields`);

    const index = isNew
      ? prevValues.length
      : prevValues.findIndex((prev) => prev.name === prevName);

    form.setValue(
      `objectTypes.${objectMeta.name}.fields.${index}`,
      {
        ...prevField,
        ...field,
        isDeleted: false,
        isNew,
      },
      { shouldDirty: true },
    );

    setEditModalState({ isOpen: false, initialData: null });
  };

  const onReorder = (
    updatedFields: ContentModelEditorFormObjectTypeField[],
  ) => {
    console.log({ updatedFields });
    form.setValue(
      `objectTypes.${objectMeta.name}.fields`,
      updatedFields.sort(sortSystemFieldsFirst),
      {
        shouldDirty: true,
      },
    );
  };

  const fields = form.watch(`objectTypes.${objectMeta.name}.fields`);

  console.log({ fields });

  return (
    <SectionWrapper data-testid="fields-editor">
      <SectionHeader>Fields</SectionHeader>
      <SectionDescription>
        Only creating and deleting fields is currently supported.
      </SectionDescription>
      {/* TODO add Skeleton here with hardcoded headings as sections headers can be filtered out when no fields exist */}
      <div className="grid grid-cols-7 gap-4 text-manatee-400 font-normal text-sm">
        <FieldHeader className="col-span-2 pl-5">Name</FieldHeader>
        <FieldHeader className="col-span-2" tooltip="The GraphQL type">
          Type
        </FieldHeader>
        <FieldHeader className="col-span-1">Translatable</FieldHeader>
        <FieldHeader tooltip="When creating an object of this type, this field will be required to be added.">
          Required
        </FieldHeader>
      </div>
      {/* {Object.entries(fieldSections).map(([id, { title, type, fields }]) => ( */}
      {/* <FieldSection
        // key={id}
        title={"title"}
        type={"system"}
        form={form}
        inputFields={combineFieldAndFieldConfigAndSortByConfigPostion(
          objectMeta.fields,
          // objectFieldConfig,
        )}
        objectMeta={objectMeta}
        onEdit={(initialData) =>
          setEditModalState({ isOpen: true, initialData })
        }
      /> */}
      <Reorder.Group onReorder={onReorder} values={fields}>
        {fields.map((field, index) => {
          return (
            <Field
              key={field.name}
              field={field}
              onDelete={() => deleteField(field, index)}
              isDeleted={field?.isDeleted}
              isNew={field?.isNew}
              onEdit={() =>
                setEditModalState({
                  isOpen: true,
                  initialData: { field },
                })
              }
            />
          );
        })}
      </Reorder.Group>
      {/* ))} */}
      <AddNewButton
        text={
          objectMeta.isBuiltIn
            ? "You cannot add fields to built-in object types"
            : `Add field`
        }
        onClick={addField}
        disabled={objectMeta.isBuiltIn}
      />
      <EditObjectFieldModal
        isOpen={editModalState.isOpen}
        initialValues={editModalState.initialData || undefined}
        setIsOpen={(isOpen) =>
          setEditModalState((prev) => ({ ...prev, isOpen }))
        }
        onSubmit={onEditFieldModalSubmit}
      />
    </SectionWrapper>
  );
};
