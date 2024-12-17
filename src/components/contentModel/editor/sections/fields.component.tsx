import clsx from "clsx";
import { Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FiCheck, FiInfo, FiRotateCcw, FiTrash2 } from "react-icons/fi";

import { Button } from "src/components/button";
import { AddNewButton } from "src/components/contentModel/editor/contentModelRowInput.component";
import {
  EditObjectFieldModal,
  EditObjectFieldModalForm,
  EditObjectFieldModalFormAvailabilityInheritanceConfiguration,
} from "src/components/modals/editObjectFieldModal/editObjectFieldModal.component";
import { InfoTooltip, Tooltip } from "src/components/tooltip/tooltip.component";
import { SkylarkObjectType, SkylarkSystemField } from "src/interfaces/skylark";
import { isSkylarkObjectType } from "src/lib/utils";

import {
  ContentModelEditorForm,
  ContentModelEditorFormObjectTypeField,
  ContentModelEditorFormObjectTypeUiConfig,
  FieldHeader,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
  sortSystemFieldsFirst,
} from "./common.component";

interface FieldsSectionProps {
  objectType: SkylarkObjectType;
  form: UseFormReturn<ContentModelEditorForm>;
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
  objectType: string;
  field: ContentModelEditorFormObjectTypeField;
  fieldConfig: ContentModelEditorFormObjectTypeUiConfig["fieldConfigs"][""];
  isDeleted?: boolean;
  isNew?: boolean;
  reorderFieldsDisabled?: boolean;
  onDelete: (field: ContentModelEditorFormObjectTypeField) => void;
  onEdit: () => void;
}

const FieldOriginalType = ({
  field,
  fieldConfig,
}: {
  field: FieldProps["field"];
  fieldConfig: FieldProps["fieldConfig"] | null;
}) => {
  const isRelationship = field.type === "relationship";

  const isEnum = !isRelationship && !!field?.enumValues;

  const originalType = isRelationship
    ? "Relationship"
    : isEnum
      ? "Enum"
      : field.originalType;

  return (
    <div className="flex">
      <p>{originalType}</p>
      {isRelationship && (
        <>
          {/* <Tooltip tooltip={<></>}> */}
          <p className="ml-2 flex justify-center items-center text-manatee-500">
            {`(${field.objectType}`}
            {/* <FiInfo className="text-sm ml-1" /> */}
            {`)`}
          </p>
          {/* </Tooltip> */}
        </>
      )}
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
      {fieldConfig?.fieldType && field.type === "string" && (
        <p className="ml-2 flex justify-center items-center text-manatee-500">
          {`(${fieldConfig.fieldType}`}
          {/* <FiInfo className="text-sm ml-1" /> */}
          {`)`}
        </p>
      )}
    </div>
  );
};

const Field = ({
  objectType,
  field,
  isDeleted,
  isNew,
  reorderFieldsDisabled,
  fieldConfig,
  onDelete,
  onEdit,
}: FieldProps) => {
  const dragControls = useDragControls();

  const isRelationship = field.type === "relationship";

  const disableDelete =
    isSkylarkObjectType(objectType) ||
    (
      [SkylarkSystemField.UID, SkylarkSystemField.ExternalID] as string[]
    ).includes(field.name);

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={dragControls}
      className="border-b last-of-type:border-b-0 border-manatee-100"
      // as="div"
      // className="relative"
      // className="my-2 bg-white z-30 border shadow border-manatee-300 rounded-lg items-center h-14 px-2 grid gap-4 grid-cols-3"
    >
      <div
        className={clsx(
          "relative text-sm items-center h-12 px-2 grid gap-4",
          "grid-cols-7",
          isDeleted
            ? "bg-error/10 text-manatee-300 border-error/15"
            : "bg-white ",
        )}
      >
        {!(
          [
            SkylarkSystemField.UID,
            SkylarkSystemField.ExternalID,
            SkylarkSystemField.Type,
          ] as string[]
        ).includes(field.name) &&
          !isRelationship && (
            <button
              disabled={reorderFieldsDisabled}
              onPointerDown={
                !reorderFieldsDisabled
                  ? (event) => {
                      dragControls.start(event);
                      event.preventDefault();
                    }
                  : undefined
              }
              className={clsx(
                "absolute left-1 h-full w-4 mr-1 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat ",
                reorderFieldsDisabled ? "opacity-10" : "opacity-30 cursor-grab",
              )}
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
          <FieldOriginalType field={field} fieldConfig={fieldConfig} />
        </div>
        <div className="flex justify-start items-center col-span-1">
          {!isRelationship && field.isTranslatable ? (
            <FiCheck className="text-success text-xl" />
          ) : (
            "-"
          )}
        </div>
        <div className="flex justify-start items-center col-span-1">
          {!isRelationship && field.isRequired ? (
            <FiCheck className="text-success text-xl" />
          ) : (
            "-"
          )}
        </div>
        <div className="flex justify-end items-center col-span-1">
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
              Icon={
                <FiTrash2
                  className={clsx("text-base", !disableDelete && "text-error")}
                />
              }
              onClick={() => onDelete(field)}
              disabled={disableDelete}
              danger
            />
          )}
        </div>
      </div>
    </Reorder.Item>
  );
};

export const FieldsSection = ({ objectType, form }: FieldsSectionProps) => {
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    initialData: EditObjectFieldModalForm | null;
  }>({ isOpen: false, initialData: null });

  const addField = () => {
    setEditModalState({ isOpen: true, initialData: null });
  };

  const deleteField = (
    field: ContentModelEditorFormObjectTypeField,
    index: number,
  ) => {
    if (field.isNew) {
      const currentFields = form.getValues(`objectTypes.${objectType}.fields`);
      currentFields.splice(index, 1);
      form.setValue(`objectTypes.${objectType}.fields`, currentFields, {
        shouldDirty: true,
      });
    } else {
      form.setValue(
        `objectTypes.${objectType}.fields.${index}`,
        {
          ...field,
          isDeleted: !Boolean(field.isDeleted),
        },
        { shouldDirty: true },
      );
    }
  };

  const onEditFieldModalSubmit = (
    submittedFormValues: EditObjectFieldModalForm,
  ) => {
    const {
      field,
      fieldConfig,
      relationshipConfig,
      availabilityInheritanceConfiguration,
    } = submittedFormValues;

    console.log("onEditFieldModalSubmit", submittedFormValues);
    const prevField = editModalState.initialData?.field;
    const prevName = prevField?.name;
    const isNew = !prevName;
    const prevValues = form.getValues(`objectTypes.${objectType}.fields`);

    const index = isNew
      ? prevValues.length
      : prevValues.findIndex((prev) => prev.name === prevName);

    form.setValue(
      `objectTypes.${objectType}.fields.${index}`,
      {
        ...prevField,
        ...field,
        isDeleted: false,
        isNew,
      },
      { shouldDirty: true },
    );

    const prevFieldConfig = editModalState.initialData?.fieldConfig;
    form.setValue(
      `objectTypes.${objectType}.uiConfig.fieldConfigs.${field.name}`,
      { ...prevFieldConfig, ...fieldConfig },
      { shouldDirty: true },
    );

    form.setValue(
      `objectTypes.${objectType}.relationshipConfigs.${field.name}.defaultSortField`,
      relationshipConfig.defaultSortField,
      { shouldDirty: true },
    );

    if (field.type === "relationship" && availabilityInheritanceConfiguration) {
      console.log("SETTING", {
        objectType,
        availabilityInheritanceConfiguration,
        keys: {
          1: `objectTypes.${objectType}.relationshipConfigs.${availabilityInheritanceConfiguration.obj.relationshipName}.inheritAvailability`,
          2: `objectTypes.${availabilityInheritanceConfiguration.obj.objectType}.relationshipConfigs.${availabilityInheritanceConfiguration.reverseObj.relationshipName}.inheritAvailability`,
        },
      });

      form.setValue(
        `objectTypes.${objectType}.relationshipConfigs.${availabilityInheritanceConfiguration.obj.relationshipName}.inheritAvailability`,
        availabilityInheritanceConfiguration.type === "forward" || false,
        { shouldDirty: true },
      );

      // Inherit Availability, set both directions
      form.setValue(
        `objectTypes.${availabilityInheritanceConfiguration.obj.objectType}.relationshipConfigs.${availabilityInheritanceConfiguration.reverseObj.relationshipName}.inheritAvailability`,
        availabilityInheritanceConfiguration.type === "backward" || false,
        { shouldDirty: true },
      );
    }

    console.log("After", form.formState.dirtyFields);

    setEditModalState({ isOpen: false, initialData: null });
  };

  const isNewObjectType = form.watch(`objectTypes.${objectType}.isNew`);
  const fields = form.watch(`objectTypes.${objectType}.fields`);
  const fieldOrder = form.watch(
    `objectTypes.${objectType}.uiConfig.fieldOrder`,
  );
  const fieldConfigs = form.watch(
    `objectTypes.${objectType}.uiConfig.fieldConfigs`,
  );

  const relationshipConfigs = form.watch(
    `objectTypes.${objectType}.relationshipConfigs`,
  );

  const onReorder = (
    updatedFields: ContentModelEditorFormObjectTypeField[],
  ) => {
    console.log({ updatedFields });
    if (!isNewObjectType) {
      form.setValue(
        `objectTypes.${objectType}.uiConfig.fieldOrder`,
        updatedFields.map(({ name }) => name).sort(sortSystemFieldsFirst),
        {
          shouldDirty: true,
        },
      );
    }
  };

  const isBuiltInObjectType = isSkylarkObjectType(objectType);

  const orderedFields = fields.sort((fieldA, fieldB) => {
    const systemFieldSorted = sortSystemFieldsFirst(fieldA.name, fieldB.name);

    if (systemFieldSorted !== 0) {
      return systemFieldSorted;
    }

    if (fieldA.type === "relationship" && fieldB.type === "relationship") {
      return fieldA.name > fieldB.name ? 1 : -1;
    }

    const fieldAValue =
      fieldA.type === "relationship"
        ? Infinity
        : (fieldOrder.indexOf(fieldA.name) ?? Infinity);

    const fieldBValue =
      fieldB.type === "relationship"
        ? Infinity
        : (fieldOrder.indexOf(fieldB.name) ?? Infinity);

    return fieldAValue > fieldBValue ? 1 : -1;
  });

  return (
    <SectionWrapper data-testid="fields-editor">
      <SectionHeader>Fields</SectionHeader>
      <SectionDescription>
        Only creating and deleting fields is currently supported.
      </SectionDescription>
      {/* TODO add Skeleton here with hardcoded headings as sections headers can be filtered out when no fields exist */}
      <div className="grid grid-cols-7 gap-4 text-manatee-400 font-normal text-sm mt-4">
        <FieldHeader className="col-span-2 pl-5">Name</FieldHeader>
        <FieldHeader className="col-span-2" tooltip="The GraphQL type">
          Type
        </FieldHeader>
        <FieldHeader className="col-span-1">Translatable</FieldHeader>
        <FieldHeader tooltip="When creating an object of this type, this field will be required to be added.">
          Required
        </FieldHeader>
      </div>
      <Reorder.Group onReorder={onReorder} values={orderedFields}>
        {orderedFields.map((field, index) => {
          const fieldConfig = fieldConfigs?.[field.name];
          const relationshipConfig = relationshipConfigs?.[field.name];

          let availabilityInheritanceConfiguration: EditObjectFieldModalFormAvailabilityInheritanceConfiguration | null =
            null;

          if (field.type === "relationship") {
            const reverseInheritAvailability = form.getValues(
              `objectTypes.${field.objectType}.relationshipConfigs.${field.reverseRelationshipName}.inheritAvailability`,
            );
            const availabilityInheritanceType: EditObjectFieldModalFormAvailabilityInheritanceConfiguration["type"] =
              (relationshipConfig?.inheritAvailability && "forward") ||
              (reverseInheritAvailability && "backward") ||
              "off";

            console.log(field.name, {
              foward: relationshipConfig?.inheritAvailability,
              backward: reverseInheritAvailability,
            });

            availabilityInheritanceConfiguration = {
              type: availabilityInheritanceType, // forward when Season -> episodes, backward when Episode -> season
              obj: {
                objectType, // e.g. Season
                relationshipName: field.relationshipName, // e.g. episodes
              },
              reverseObj: {
                objectType: field.objectType, // e.g. Episode
                relationshipName: field.reverseRelationshipName, // e.g. seasons
              },
            };
          }

          // TODO figure out how to get reverse relationship config for edit modal form
          return (
            <Field
              key={field.name}
              field={field}
              fieldConfig={fieldConfig || null}
              objectType={objectType}
              onDelete={() => deleteField(field, index)}
              isDeleted={field?.isDeleted}
              isNew={field?.isNew}
              onEdit={() =>
                setEditModalState({
                  isOpen: true,
                  initialData: {
                    field,
                    fieldConfig,
                    relationshipConfig,
                    availabilityInheritanceConfiguration,
                  },
                })
              }
            />
          );
        })}
      </Reorder.Group>
      <AddNewButton
        text={
          isBuiltInObjectType
            ? "You cannot add fields to built-in object types"
            : `Add field`
        }
        onClick={addField}
        disabled={isBuiltInObjectType}
      />
      <EditObjectFieldModal
        objectType={objectType}
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
