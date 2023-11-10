import clsx from "clsx";
import { Reorder } from "framer-motion";
import { ReactNode, useCallback } from "react";
import { useForm } from "react-hook-form";
import { FiInfo } from "react-icons/fi";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { ColourPicker } from "src/components/inputs/colourPicker";
import { TextInput } from "src/components/inputs/textInput";
import { Toast } from "src/components/toast/toast.component";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { SYSTEM_FIELDS } from "src/constants/skylark";
import { useUpdateObjectTypeConfig } from "src/hooks/schema/update/useUpdateObjectTypeConfig";
import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfigFieldConfig,
  InputFieldWithFieldConfig,
} from "src/interfaces/skylark";
import { isSkylarkObjectType } from "src/lib/utils";

import { ContentModelEditorHeader } from "./contentModelEditorHeader.component";
import { ObjectTypeFieldInput } from "./contentModelRowInput.component";

type FieldSection = "system" | "translatable" | "global";

type FieldSectionObject = Record<
  "system" | "translatable" | "global",
  { title: string; fields: InputFieldWithFieldConfig[] }
>;

const sectionClassName = "my-10 border-t pt-10";

const uiDisplayFieldTooltip =
  "A config property that instructs the UI which field it should use when displaying an object on listing pages.";

const combineFieldAndFieldConfigAndSortByConfigPostion = (
  inputFields: NormalizedObjectField[],
  getFields: NormalizedObjectField[],
  objectFieldConfig?: ParsedSkylarkObjectConfig,
): InputFieldWithFieldConfig[] => {
  // Some fields are not in input fields but we need to display them anyway, e.g. UID
  const inputFieldNames = inputFields.map(({ name }) => name);
  const missingInputFields = getFields.filter(
    ({ name }) => !inputFieldNames.includes(name),
  );

  const inputFieldsWithFieldConfig = [...inputFields, ...missingInputFields]
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

const splitFieldsIntoSystemGlobalTranslatable = (
  inputFieldsWithFieldConfig: InputFieldWithFieldConfig[],
  objectMetaFieldConfig: SkylarkObjectMeta["fieldConfig"],
) => {
  const splitFields = inputFieldsWithFieldConfig.reduce(
    (prev, fieldWithConfig) => {
      const fieldName = fieldWithConfig.field.name;

      if (SYSTEM_FIELDS.includes(fieldName)) {
        return {
          ...prev,
          systemFields: [...prev.systemFields, fieldWithConfig].sort(
            ({ field: a }, { field: b }) =>
              SYSTEM_FIELDS.indexOf(a.name) - SYSTEM_FIELDS.indexOf(b.name),
          ),
        };
      }

      if (objectMetaFieldConfig.global.includes(fieldName)) {
        return {
          ...prev,
          globalFields: [...prev.globalFields, fieldWithConfig],
        };
      }

      if (objectMetaFieldConfig.translatable.includes(fieldName)) {
        return {
          ...prev,
          translatableFields: [...prev.translatableFields, fieldWithConfig],
        };
      }

      return prev;
    },
    {
      systemFields: [] as InputFieldWithFieldConfig[],
      translatableFields: [] as InputFieldWithFieldConfig[],
      globalFields: [] as InputFieldWithFieldConfig[],
    },
  );

  return splitFields;
};

const createFieldSections = (
  objectMeta: SkylarkObjectMeta,
  objectFieldConfig?: ParsedSkylarkObjectConfig,
) => {
  const fieldsWithConfig = combineFieldAndFieldConfigAndSortByConfigPostion(
    objectMeta.operations.create.inputs,
    objectMeta.fields,
    objectFieldConfig,
  );

  const splitFields = splitFieldsIntoSystemGlobalTranslatable(
    fieldsWithConfig,
    objectMeta.fieldConfig,
  );

  const sections: FieldSectionObject = {
    system: {
      title: "System",
      fields: splitFields?.systemFields || [],
    },
    translatable: {
      title: "Translatable",
      fields: splitFields?.translatableFields || [],
    },
    global: {
      title: "Global",
      fields: splitFields?.globalFields || [],
    },
  };

  return sections;
};

const InfoTooltip = ({ tooltip }: { tooltip: ReactNode }) => (
  <Tooltip tooltip={tooltip}>
    <div className="ml-1">
      <FiInfo className="text-base" />
    </div>
  </Tooltip>
);

const SectionHeader = ({ children }: { children: ReactNode }) => (
  <h3 className="text-xl">{children}</h3>
);

const FieldHeader = ({
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
      <div className="grid grid-cols-8 gap-4 text-manatee-400 font-normal text-sm">
        <FieldHeader className="col-span-2">Name</FieldHeader>
        <FieldHeader className="col-span-2" tooltip="The GraphQL type">
          Type
        </FieldHeader>
        <FieldHeader className="col-span-2">Enum / UI type</FieldHeader>
        <FieldHeader tooltip="When creating an object of this type, this field will be required to be added.">
          Required
        </FieldHeader>
        <FieldHeader tooltip={uiDisplayFieldTooltip}>
          UI Display field
        </FieldHeader>
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

export const ObjectTypeEditor = ({
  objectMeta,
  objectConfig,
}: {
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
}) => {
  const form = useForm<{
    fieldSections: FieldSectionObject;
    objectTypeDisplayName: string;
    primaryField: string | undefined | null;
    colour: string | undefined | null;
  }>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
    values: {
      fieldSections: createFieldSections(objectMeta, objectConfig),
      objectTypeDisplayName:
        objectConfig?.objectTypeDisplayName || objectMeta.name,
      primaryField: objectConfig?.primaryField,
      colour: objectConfig?.colour,
    },
  });

  const { updateObjectTypeConfig, isUpdatingObjectTypeConfig } =
    useUpdateObjectTypeConfig({
      onSuccess: () => {
        form.reset(undefined, { keepValues: true });
        toast.success(
          <Toast
            title={`${objectMeta.name} updated`}
            message={[
              "The Object Type has been updated.",
              "You may have to refresh for the configuration changes to take effect.",
            ]}
          />,
        );
      },
      onError: () => {
        toast.error(
          <Toast
            title={`Batch deletion failed to trigger`}
            message={[
              "Unable to trigger a deletion for the selected objects.",
              "Please try again later.",
            ]}
          />,
        );
      },
    });

  const onSave = () => {
    console.log("onSave", form.formState.isDirty, form.formState.dirtyFields);
    form.handleSubmit(
      ({ fieldSections, primaryField, objectTypeDisplayName, colour }) => {
        const fieldConfig: ParsedSkylarkObjectConfigFieldConfig[] = [
          ...fieldSections.system.fields,
          ...fieldSections.translatable.fields,
          ...fieldSections.global.fields,
        ].map(
          (fieldWithConfig, index): ParsedSkylarkObjectConfigFieldConfig => ({
            name: fieldWithConfig.field.name,
            fieldType: fieldWithConfig.config?.fieldType || null,
            position: index + 1,
          }),
        );
        const parsedConfig: ParsedSkylarkObjectConfig = {
          ...objectConfig,
          primaryField,
          fieldConfig,
          objectTypeDisplayName,
          colour,
        };
        console.log("onSave", { parsedConfig });

        updateObjectTypeConfig({
          objectType: objectMeta.name,
          ...parsedConfig,
        });
      },
    )();
  };

  // TODO improve by passing form into components so that we don't have to use a watch this high
  const { fieldSections, objectTypeDisplayName, primaryField, colour } =
    form.watch();

  const onFieldChange = useCallback(
    (id: FieldSection, reorderedFields: InputFieldWithFieldConfig[]) => {
      form.setValue(`fieldSections.${id}.fields`, reorderedFields, {
        shouldDirty: true,
      });
    },
    [form],
  );

  return (
    <div key={objectMeta.name} className="">
      <div className="flex justify-between mb-10">
        <div className="flex flex-col items-start">
          <ContentModelEditorHeader objectType={objectMeta.name} />
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            danger
            disabled={isUpdatingObjectTypeConfig || !form.formState.isDirty}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            loading={isUpdatingObjectTypeConfig}
            disabled={!form.formState.isDirty}
          >
            Save
          </Button>
        </div>
      </div>
      <section className={sectionClassName}>
        <SectionHeader>UI Config</SectionHeader>
        <div className="grid grid-cols-3 items-center auto-rows-fr gap-x-2 text-sm text-manatee-600 mt-4 w-fit gap-y-1">
          <FieldHeader
            className="col-span-1"
            tooltip="A mask for the Object Type, in case you want it to display differently in the UI. Useful when you have Object Types with many characters."
          >
            Display name
          </FieldHeader>
          {/* <p className="text-black">{objectTypeDisplayName}</p> */}
          <div className="col-span-2">
            <TextInput
              value={objectTypeDisplayName}
              onChange={(str) =>
                form.setValue("objectTypeDisplayName", str, {
                  shouldDirty: true,
                })
              }
            />
          </div>
          <FieldHeader className="col-span-1" tooltip={uiDisplayFieldTooltip}>
            Display field
          </FieldHeader>
          <p className="text-black col-span-2">{primaryField}</p>
          <FieldHeader
            className="col-span-1"
            tooltip="Colour to represent the Object Type in the UI. Useful to identify an Object Type at a glance."
          >
            Colour
          </FieldHeader>
          <div className="col-span-2">
            <ColourPicker
              colour={colour || ""}
              onChange={(colour) =>
                form.setValue("colour", colour, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </section>
      <section className={sectionClassName}>
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
              onFieldChange(id as FieldSection, fieldsWithConfig)
            }
            onPrimaryFieldChange={(field) =>
              form.setValue("primaryField", field, { shouldDirty: true })
            }
          />
        ))}
      </section>
    </div>
  );
};
