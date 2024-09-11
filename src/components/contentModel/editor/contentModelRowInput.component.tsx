import clsx from "clsx";
import { useDragControls, Reorder } from "framer-motion";
import {
  FiInfo,
  FiLoader,
  FiPlus,
  FiRefreshCcw,
  FiRotateCcw,
  FiTrash,
  FiTrash2,
} from "react-icons/fi";

import { Button } from "src/components/button";
import { Checkbox } from "src/components/inputs/checkbox";
import { Input, TextInput } from "src/components/inputs/input";
import { Select } from "src/components/inputs/select";
import { EnumSelect } from "src/components/inputs/select/enumSelect/enumSelect.component";
import { InfoTooltip, Tooltip } from "src/components/tooltip/tooltip.component";
import { useSkylarkSchemaEnums } from "src/hooks/useSkylarkSchemaEnums";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  SkylarkObjectConfigFieldType,
  SkylarkSystemField,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfigFieldConfig,
  InputFieldWithFieldConfig,
  NormalizedObjectField,
} from "src/interfaces/skylark";
import { parseObjectInputType } from "src/lib/skylark/parsers";
import { isSkylarkObjectType } from "src/lib/utils";

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

export const ObjectTypeUIConfigFieldInput = ({
  fieldWithConfig,
  objectMeta,
  disableReorder,
  onChange,
}: {
  fieldWithConfig: InputFieldWithFieldConfig;
  objectMeta: SkylarkObjectMeta;
  disableReorder?: boolean;
  onChange: (fieldWithConfig: InputFieldWithFieldConfig) => void;
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
      className="my-2 bg-white z-30 border shadow border-manatee-300 rounded-lg items-center h-14 px-2 grid gap-4 grid-cols-3"
    >
      <div
        className={clsx(
          "flex justify-start h-full items-center col-span-1",
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
        <p>{field.name}</p>
        <FieldNameTooltip field={field.name} />
      </div>
      <div className="flex justify-start items-center h-full col-span-1">
        <p>{isEnum ? "Enum" : field.originalType}</p>
      </div>
      <div className="flex justify-start items-center h-full col-span-1 w-full">
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
      </div>
    </Reorder.Item>
  );
};

export const ObjectTypeFieldInput = ({
  field,
  objectMeta,
  showInput: showInputProp,
  allowModifyName,
  isDeleted,
  isNew,
  onChange,
  onDelete,
}: {
  field: NormalizedObjectField;
  objectMeta: SkylarkObjectMeta;
  showInput: boolean;
  allowModifyName?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
  onChange: (field: NormalizedObjectField) => void;
  onDelete: (field: NormalizedObjectField) => void;
}) => {
  const isEnum = !!field?.enumValues;

  const { enums } = useSkylarkSchemaEnums();

  const showInput =
    field &&
    showInputProp &&
    !isSkylarkObjectType(objectMeta.name) &&
    field.name !== SkylarkSystemField.UID;

  const showDelete = showInput && field.name !== SkylarkSystemField.ExternalID;

  return (
    <div
      className={clsx(
        "my-2 border relative rounded-lg items-center h-14 px-2 grid gap-4",
        "grid-cols-7",
        isDeleted
          ? "bg-error/10 text-manatee-300 border-error/15"
          : "bg-white shadow border-manatee-300",
      )}
    >
      <div
        className={clsx(
          "flex justify-start h-full items-center col-span-2 pl-5",
        )}
      >
        {/* <p className="mr-1 text-brand-primary font-light">
          {fieldConfig?.position}
        </p> */}
        {/* <p>{sentenceCase(field.name)}</p> */}
        {allowModifyName ? (
          <TextInput
            value={field.name}
            onChange={(str) => onChange({ ...field, name: str })}
          />
        ) : (
          <p>{field.name}</p>
        )}
        <FieldNameTooltip field={field.name} />
        {/* <Tooltip tooltip={`GraphQL field: ${field.name}`}>
          <div className="ml-2">
            <FiInfo className="text-base" />
          </div>
        </Tooltip> */}
      </div>
      <div className="flex justify-start items-center h-full col-span-2">
        {showInput ? (
          <Select
            options={graphQLFields.map((value) => ({
              value,
              label: value,
            }))}
            variant="primary"
            selected={isEnum ? "Enum" : field.originalType}
            placeholder=""
            onChange={(value) => {
              const defaultEnum = enums?.[0];
              onChange({
                ...field,
                enumValues:
                  value === "Enum"
                    ? defaultEnum?.enumValues.map(({ name }) => name)
                    : undefined,
                originalType:
                  value === "Enum"
                    ? (defaultEnum?.name as GQLScalars) || "String"
                    : value,
                type: parseObjectInputType(value),
              });
            }}
            // disabled
          />
        ) : (
          <p>{isEnum ? "Enum" : field.originalType}</p>
        )}
      </div>
      <div className="flex justify-start items-center h-full col-span-2 w-full">
        {isEnum && (
          <>
            {showInput ? (
              <EnumSelect
                variant="primary"
                selected={field.originalType}
                placeholder=""
                className="w-full"
                onChange={({ name, enumValues }) => {
                  onChange({
                    ...field,
                    enumValues: enumValues.map(({ name }) => name),
                    originalType: name as GQLScalars,
                    type: "enum",
                  });
                }}
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
          disabled={!showInput}
          onCheckedChange={(checked) =>
            onChange({ ...field, isRequired: Boolean(checked) })
          }
        />
      </div>
      <div className="flex justify-center items-center absolute right-4">
        {showDelete && (
          <Button
            variant="ghost"
            Icon={<FiTrash2 className="text-base text-error" />}
            onClick={() => onDelete(field)}
          />
        )}
        {isDeleted && !isNew && (
          <Button
            variant="ghost"
            Icon={<FiRotateCcw className="text-base" />}
            onClick={() => onDelete(field)}
          />
        )}
      </div>
    </div>
  );
};

export const AddNewButton = ({
  onClick,
  text,
}: {
  onClick: () => void;
  text: string;
}) => (
  <button
    onClick={onClick}
    className="my-2 bg-manatee-50 z-30 border flex justify-center text-manatee-500 hover:bg-brand-primary/10 hover:text-manatee-800 transition-colors w-full shadow-sm border-manatee-200 rounded-lg items-center h-14 px-2 text-sm"
  >
    <FiPlus />
    <span>{text}</span>
  </button>
);
