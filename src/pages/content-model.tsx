import clsx from "clsx";
import { Reorder, useDragControls } from "framer-motion";
import { ReactNode, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { FiCheckSquare, FiEdit, FiInfo, FiXSquare } from "react-icons/fi";

import { Button } from "src/components/button";
import { Spinner } from "src/components/icons";
import { Checkbox } from "src/components/inputs/checkbox";
import { ColourPicker } from "src/components/inputs/colourPicker";
import { Select } from "src/components/inputs/select";
import { EnumSelect } from "src/components/inputs/select/enumSelect/enumSelect.component";
import { TextInput } from "src/components/inputs/textInput";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { SYSTEM_FIELDS } from "src/constants/skylark";
import { useUpdateObjectTypeConfig } from "src/hooks/schema/update/useUpdateObjectTypeConfig";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
  useSkylarkSetObjectTypes,
} from "src/hooks/useSkylarkObjectTypes";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectConfigFieldConfig,
  SkylarkObjectConfigFieldType,
  SkylarkObjectMeta,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";

type InputFieldWithFieldConfig = {
  field: NormalizedObjectField;
  config?: ParsedSkylarkObjectConfigFieldConfig;
};

type FieldSection = "system" | "translatable" | "global";

type FieldSectionObject = Record<
  "system" | "translatable" | "global",
  { title: string; fields: InputFieldWithFieldConfig[] }
>;

const isSkylarkObjectType = (objectType: string) =>
  objectType === BuiltInSkylarkObjectType.Availability ||
  objectType.toUpperCase().startsWith("SKYLARK");

const graphQLFields: (GQLScalars | "Enum")[] = [
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
];

const objectConfigFieldTypes: SkylarkObjectConfigFieldType[] = [
  "STRING",
  "TEXTAREA",
  "WYSIWYG",
  "TIMEZONE",
  "COLOURPICKER",
];

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

const ObjectTypeNavigationSection = ({
  title,
  activeObjectType,
  objectTypesWithConfig,
  setObjectType,
}: {
  title: string;
  activeObjectType: string;
  objectTypesWithConfig: {
    objectType: string;
    config: ParsedSkylarkObjectConfig;
  }[];
  setObjectType: (objectType: string) => void;
}) => (
  <div className="flex flex-col justify-start items-start my-4">
    <p className="mb-1 font-medium text-lg">{title}</p>
    {objectTypesWithConfig?.map(({ objectType, config }) => {
      return (
        <button
          key={objectType}
          className={clsx(
            "my-1 flex items-center",
            activeObjectType === objectType
              ? "text-black font-medium"
              : "text-manatee-600",
          )}
          onClick={() => setObjectType(objectType)}
        >
          <span
            className="w-4 h-4 block rounded mr-1"
            style={{ backgroundColor: config.colour || undefined }}
          />
          {config.objectTypeDisplayName &&
          config.objectTypeDisplayName !== objectType ? (
            <>
              {objectType}{" "}
              <span className="text-manatee-400 font-normal ml-1">
                ({config.objectTypeDisplayName})
              </span>
            </>
          ) : (
            objectType
          )}
        </button>
      );
    })}
  </div>
);

const ObjectTypeNavigation = ({
  activeObjectType,
  setObjectType,
}: {
  activeObjectType: string;
  setObjectType: (objectType: string) => void;
}) => {
  const { setObjectTypes } = useSkylarkSetObjectTypes(true);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const setObjectTypesWithConfig = objectTypesWithConfig?.filter(
    ({ objectType }) => setObjectTypes?.includes(objectType),
  );
  const systemObjectTypesWithConfig = objectTypesWithConfig?.filter(
    ({ objectType }) =>
      isSkylarkObjectType(objectType) && !setObjectTypes?.includes(objectType),
  );
  const customObjectTypesWithConfig = objectTypesWithConfig?.filter(
    ({ objectType }) =>
      !isSkylarkObjectType(objectType) && !setObjectTypes?.includes(objectType),
  );

  return (
    <div className="flex flex-col text-left items-start">
      <ObjectTypeNavigationSection
        title="Sets"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={setObjectTypesWithConfig || []}
        setObjectType={setObjectType}
      />
      <ObjectTypeNavigationSection
        title="Custom Object Types"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={customObjectTypesWithConfig || []}
        setObjectType={setObjectType}
      />
      <ObjectTypeNavigationSection
        title="System Object Types"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={systemObjectTypesWithConfig || []}
        setObjectType={setObjectType}
      />
    </div>
  );
};

const InfoTooltip = ({ tooltip }: { tooltip: ReactNode }) => (
  <Tooltip tooltip={tooltip}>
    <div className="ml-1">
      <FiInfo className="text-base" />
    </div>
  </Tooltip>
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

const FieldRow = ({
  fieldWithConfig,
  objectMeta,
  isPrimaryField,
  disableReorder,
  onChange,
  onPrimaryFieldCheckedChange,
}: {
  fieldWithConfig: InputFieldWithFieldConfig;
  objectMeta: SkylarkObjectMeta;
  isPrimaryField: boolean;
  disableReorder?: boolean;
  onChange: (fieldWithConfig: InputFieldWithFieldConfig) => void;
  onPrimaryFieldCheckedChange: (checked: boolean) => void;
}) => {
  const dragControls = useDragControls();

  const { field, config: fieldConfig } = fieldWithConfig;
  const isEnum = !!field?.enumValues;

  const handleFieldConfigChange = (
    partialFieldConfig: Partial<ParsedSkylarkObjectConfigFieldConfig>,
  ) => {
    onChange({
      ...fieldWithConfig,
      config: {
        name: field.name,
        fieldType: null,
        position: 100,
        ...(fieldConfig || {}),
        ...partialFieldConfig,
      },
    });
  };

  return (
    <Reorder.Item
      value={fieldWithConfig}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className="my-2 bg-white z-30 border shadow border-manatee-300 rounded-lg items-center h-14 px-2 grid gap-4 grid-cols-8"
    >
      <div
        className={clsx(
          "flex justify-start h-full items-center col-span-2",
          disableReorder && "pl-5",
        )}
      >
        {!disableReorder && (
          <div
            onPointerDown={(event) => {
              dragControls.start(event);
              event.preventDefault();
            }}
            className="h-full w-5 mr-1 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat opacity-60 cursor-grab"
          />
        )}
        {/* <p className="mr-1 text-brand-primary font-light">
          {fieldConfig?.position}
        </p> */}
        {/* <p>{sentenceCase(field.name)}</p> */}
        <p>{field.name}</p>
        <FieldNameTooltip field={field.name} />
        {/* <Tooltip tooltip={`GraphQL field: ${field.name}`}>
          <div className="ml-2">
            <FiInfo className="text-base" />
          </div>
        </Tooltip> */}
      </div>
      <div className="flex justify-start items-center h-full col-span-2">
        {/* {field && !isSkylarkObjectType(objectMeta.name) ? (
          <Select
            options={graphQLFields.map((value) => ({
              value,
              label: value,
            }))}
            allowCustomValue
            variant="primary"
            selected={isEnum ? "Enum" : field.originalType}
            placeholder=""
            disabled
          />
        ) : (
          <p>{isEnum ? "Enum" : field.originalType}</p>
        )} */}
        <p>{isEnum ? "Enum" : field.originalType}</p>
      </div>
      <div className="flex justify-start items-center h-full col-span-2 w-full">
        {!(
          [SkylarkSystemField.UID, SkylarkSystemField.ExternalID] as string[]
        ).includes(field.name) &&
          field.originalType.toUpperCase() === "STRING" && (
            <Select
              className="w-full"
              options={(objectConfigFieldTypes as string[]).map((value) => ({
                value,
                label: value,
              }))}
              variant="primary"
              selected={fieldConfig?.fieldType as string | undefined}
              placeholder=""
              onChange={(fieldType) =>
                handleFieldConfigChange({
                  fieldType: fieldType as SkylarkObjectConfigFieldType,
                })
              }
              onValueClear={() =>
                handleFieldConfigChange({
                  fieldType: null,
                })
              }
            />
          )}
        {isEnum && (
          <>
            {!isSkylarkObjectType(objectMeta.name) ? (
              <EnumSelect
                variant="primary"
                selected={field.originalType}
                placeholder=""
                // disabled
                className="w-full"
              />
            ) : (
              <>
                <p className="flex-grow">{field.originalType}</p>
                <Tooltip
                  tooltip={
                    <>
                      {/* <p className="mb-2 font-medium">Values:</p> */}
                      <ul>
                        {field.enumValues?.map((value) => (
                          <li key={value}>{value}</li>
                        ))}
                      </ul>
                    </>
                  }
                >
                  <div className="ml-2">
                    <FiInfo className="text-base" />
                  </div>
                </Tooltip>
              </>
            )}
          </>
        )}
      </div>
      <div className="flex justify-center items-center">
        <Checkbox
          checked={field.isRequired}
          disabled
          // disabled={field.name === SkylarkSystemField.UID}
        />
      </div>
      <div className="flex justify-center items-center">
        <Checkbox
          checked={isPrimaryField}
          onCheckedChange={onPrimaryFieldCheckedChange}
        />
      </div>
    </Reorder.Item>
  );
};

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
        <FieldHeader tooltip="A config property that instructs the UI which field it should use when displaying an object on listing pages.">
          UI Display field
        </FieldHeader>
      </div>
      <Reorder.Group onReorder={onChange} values={fields}>
        {fields.map((fieldWithConfig) => {
          const fieldName = fieldWithConfig.field.name;
          return (
            <FieldRow
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

const ObjectTypeHeading = ({
  className,
  name,
  onRename,
}: {
  className?: string;
  name: string;
  onRename: (name: string) => void;
}) => {
  const [updatedName, setUpdatedName] = useState<string | null>(null);

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        {updatedName !== null ? (
          <>
            <TextInput
              onChange={setUpdatedName}
              value={updatedName}
              className="w-full text-sm md:w-80 md:text-base lg:w-96"
              aria-label="tab name input"
              onEnterKeyPress={() => {
                if (updatedName.length > 0) {
                  onRename(updatedName);
                  setUpdatedName(null);
                }
              }}
            />
            <Button
              variant="ghost"
              className="text-success"
              aria-label="save tab rename"
              disabled={updatedName.length === 0}
              onClick={() => {
                onRename(updatedName);
                setUpdatedName(null);
              }}
            >
              <FiCheckSquare className="text-lg" />
            </Button>
            <Button
              variant="ghost"
              className="text-error"
              aria-label="cancel tab rename"
              onClick={() => {
                setUpdatedName(null);
              }}
            >
              <FiXSquare className="text-lg" />
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">{name}</h2>
            <Button
              variant="ghost"
              className="text-manatee-400 hover:text-black"
              onClick={() => {
                setUpdatedName(name || "");
              }}
              aria-label="Rename object type UI name"
            >
              <FiEdit className="text-lg" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const ObjectTypeEditor = ({
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
      onSuccess: console.log,
      onError: console.error,
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
          objectTypeConfig: parsedConfig,
        });
      },
      console.error,
    )();
  };

  // TODO improve by passing form into components so that we don't have to use a watch this high
  const { fieldSections, objectTypeDisplayName, primaryField, colour } =
    form.watch();

  const onFieldChange = useCallback(
    (id: FieldSection, reorderedFields: InputFieldWithFieldConfig[]) => {
      // setFieldSections((prevSections) => {
      //   return {
      //     ...prevSections,
      //     [id]: {
      //       ...prevSections[id],
      //       fields: reorderedFields,
      //     },
      //   };
      // });
      // form.setValue("fieldSections", {
      //   ...fieldSections,
      //   [id]: {
      //     ...fieldSections[id],
      //     fields: reorderedFields,
      //   },
      // });
      form.setValue(`fieldSections.${id}.fields`, reorderedFields);
    },
    [form],
  );

  return (
    <div key={objectMeta.name} className="">
      <div className="flex justify-between mb-10">
        <div className="flex flex-col">
          <div className="flex space-x-2 items-center">
            {/* <h3 className="text-2xl font-semibold">
              {objectConfig?.objectTypeDisplayName || objectMeta.name}
            </h3> */}
            <ColourPicker
              colour={colour || ""}
              onChange={(colour) => form.setValue("colour", colour)}
            />
            <ObjectTypeHeading
              onRename={(name) => form.setValue("objectTypeDisplayName", name)}
              name={objectTypeDisplayName}
            />
          </div>
          <div className="flex space-x-2 font-normal text-sm text-manatee-300">
            <p>{objectMeta.name}</p>
            {isSkylarkObjectType(objectMeta.name) && <p>(System Object)</p>}
          </div>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            danger
            disabled={isUpdatingObjectTypeConfig}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            loading={isUpdatingObjectTypeConfig}
          >
            Save
          </Button>
        </div>
      </div>
      <h4 className="text-xl">Fields</h4>
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
          onPrimaryFieldChange={(field) => form.setValue("primaryField", field)}
        />
      ))}
    </div>
  );
};

export default function SelfConfiguration() {
  const { objects: allObjectsMeta } = useAllObjectsMeta(true); // TODO do we want to show the Favourite List?
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const [activeObjectType, setObjectType] = useState<SkylarkObjectType | null>(
    null,
  );

  const objectMeta =
    allObjectsMeta?.find(({ name }) => name === activeObjectType) ||
    allObjectsMeta?.find(
      ({ name }) => name === objectTypesWithConfig?.[0].objectType,
    );

  const config = objectTypesWithConfig?.find(
    ({ objectType }) => objectType === objectMeta?.name,
  )?.config;

  return (
    <>
      <div className="mt-28 max-w-7xl mx-auto grid grid-cols-4">
        <ObjectTypeNavigation
          setObjectType={setObjectType}
          activeObjectType={
            activeObjectType || objectTypesWithConfig?.[0].objectType || ""
          }
        />
        <div className="col-span-3">
          {objectMeta && objectTypesWithConfig ? (
            <ObjectTypeEditor
              key={`${objectMeta.name}-${config}`}
              objectMeta={objectMeta}
              objectConfig={config}
            />
          ) : (
            <div className="flex justify-center w-full h-full items-center">
              <Spinner className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
