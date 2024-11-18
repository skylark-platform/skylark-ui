import clsx from "clsx";
import { useDragControls, Reorder } from "framer-motion";
import { FiInfo } from "react-icons/fi";

import { Checkbox } from "src/components/inputs/checkbox";
import { Select } from "src/components/inputs/select";
import { EnumSelect } from "src/components/inputs/select/enumSelect/enumSelect.component";
import { InfoTooltip, Tooltip } from "src/components/tooltip/tooltip.component";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  SkylarkObjectConfigFieldType,
  SkylarkSystemField,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfigFieldConfig,
  InputFieldWithFieldConfig,
} from "src/interfaces/skylark";
import { isSkylarkObjectType } from "src/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export const ObjectTypeFieldInput = ({
  fieldWithConfig,
  objectMeta,
  disableReorder,
  onChange,
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
      className="my-2 bg-white z-30 border shadow border-manatee-300 rounded-lg items-center h-14 px-2 grid gap-4 grid-cols-7"
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
                disabled
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
      {/* <div className="flex justify-center items-center">
        <Checkbox
          checked={isPrimaryField}
          onCheckedChange={onPrimaryFieldCheckedChange}
        />
      </div> */}
    </Reorder.Item>
  );
};
