import { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useMemo } from "react";
import {
  UseFormRegister,
  FieldValues,
  Controller,
  Control,
  UseFormReturn,
} from "react-hook-form";

import { Checkbox } from "src/components/checkbox";
import { convertFieldTypeToInputType } from "src/components/panel/panelInputs";
import {
  PanelFieldTitle,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Select } from "src/components/select";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useImageSize } from "src/hooks/useImageSize";
import {
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { formatObjectField, hasProperty } from "src/lib/utils";

const systemFields: string[] = [
  SkylarkSystemField.UID,
  SkylarkSystemField.ExternalID,
  SkylarkSystemField.Slug,
];
const objectOptions: Record<SkylarkObjectType, { fieldsToHide: string[] }> = {
  Image: {
    fieldsToHide: ["external_url", "upload_url", "download_from_url"],
  },
};

interface PanelMetadataProps {
  objectType: SkylarkObjectType;
  objectMeta: SkylarkObjectMeta;
  metadata: Record<string, SkylarkObjectMetadataField>;
  form: UseFormReturn<Record<string, SkylarkObjectMetadataField>>;
}

const PanelMetadataProperty = ({
  property,
  value,
}: {
  property: string;
  value?: JSX.Element | SkylarkObjectMetadataField;
}) => (
  // <div className="mb-4">
  //   <h3 className="mb-2 font-bold">{formatObjectField(property)}</h3>
  //   <div className="text-base-content">{value ? value : "---"}</div>
  // </div>
  <div>
    <PanelFieldTitle text={formatObjectField(property)} />
    <p className="mb-4 text-base-content">{value ? value : "---"}</p>
  </div>
);

const PanelMetadataInput = ({
  property,
  config,
  register,
  control,
  value,
}: {
  property: string;
  config: NormalizedObjectField;
  register: UseFormRegister<FieldValues>;
  control: Control<PanelMetadataProps["metadata"]>;
  value: SkylarkObjectMetadataField;
}) => (
  <div className="mb-4">
    <label className="mb-2 block font-bold" htmlFor={property}>
      {formatObjectField(property)}
      {config.isRequired && <span className="pl-1 text-error">*</span>}
    </label>
    {config.type === "enum" && (
      <Controller
        name={property}
        control={control}
        render={({ field }) => (
          <Select
            className="w-full"
            variant="primary"
            selected={(field.value as string) || ""}
            options={
              config.enumValues?.map((opt) => ({
                value: opt,
                label: opt,
              })) || []
            }
            placeholder=""
            onChange={field.onChange}
          />
        )}
      />
    )}
    {config.type === "boolean" && (
      <Controller
        name={property}
        control={control}
        render={({ field }) => (
          <Checkbox
            checked={field.value as CheckedState}
            onCheckedChange={(checked) => field.onChange(checked)}
          />
        )}
      />
    )}
    {config.type === "string" && !systemFields.includes(property) && (
      <textarea
        {...register(property)}
        rows={
          (value &&
            (((value as string).length > 1000 && 18) ||
              ((value as string).length > 150 && 9) ||
              ((value as string).length > 50 && 5))) ||
          1
        }
        className="w-full rounded-sm bg-manatee-50 py-3 px-4"
      />
    )}
    {(!["enum", "boolean", "string"].includes(config.type) ||
      systemFields.includes(property)) && (
      <input
        {...register(property)}
        type={convertFieldTypeToInputType(config.type)}
        className="w-full rounded-sm bg-manatee-50 py-3 px-4"
      />
    )}
  </div>
);

const AdditionalImageMetadata = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) => {
  const { size } = useImageSize(src);
  return (
    <>
      <PanelMetadataProperty
        property="Original Size"
        value={size ? `${size?.h}x${size?.w}` : ""}
      />
      <PanelMetadataProperty
        property="Rendered image"
        value={
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={alt} />
        }
      />
    </>
  );
};

export const PanelMetadata = ({
  metadata,
  objectType,
  objectMeta,
  form: { register, getValues, control, reset },
}: PanelMetadataProps) => {
  const options =
    hasProperty(objectOptions, objectType) && objectOptions[objectType];

  // When component first loads, update the form metadata with the current values
  useEffect(() => {
    reset(metadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    systemMetadataFields,
    languageGlobalMetadataFields,
  }: {
    systemMetadataFields: {
      field: string;
      config?: NormalizedObjectField;
    }[];
    languageGlobalMetadataFields: {
      field: string;
      config?: NormalizedObjectField;
    }[];
  } = useMemo(() => {
    const metadataArr = Object.keys(metadata).map((field) => {
      // Use update operation fields as get doesn't always have the full types
      const fieldConfig = objectMeta.operations.update.inputs.find(
        ({ name }) => name === field,
      );
      return {
        field,
        config: fieldConfig,
      };
    });

    const systemFieldsThatExist = metadataArr
      .filter(({ field }) => systemFields.includes(field))
      .sort(
        ({ field: a }, { field: b }) =>
          systemFields.indexOf(a) - systemFields.indexOf(b),
      );

    const otherFields = metadataArr.filter(
      ({ field }) => !systemFields.includes(field),
    );

    const fieldsToHide = options
      ? [...options.fieldsToHide, OBJECT_LIST_TABLE.columnIds.objectType]
      : [OBJECT_LIST_TABLE.columnIds.objectType];

    return {
      systemMetadataFields: systemFieldsThatExist.filter(
        ({ field }) => !fieldsToHide.includes(field.toLowerCase()),
      ),
      languageGlobalMetadataFields: otherFields.filter(
        ({ field }) => !fieldsToHide.includes(field.toLowerCase()),
      ),
    };
  }, [metadata, objectMeta.operations.update.inputs, options]);

  return (
    <form
      className="overflow-anywhere h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20"
      data-testid="panel-metadata"
    >
      {metadata && (
        <>
          {[
            {
              id: "system",
              title: "System Metadata",
              metadataFields: systemMetadataFields,
            },
            {
              id: "languageGlobal",
              title: "Translatable & Global Metadata",
              metadataFields: languageGlobalMetadataFields,
            },
          ].map(({ id, title, metadataFields }) => (
            <div key={id} className="mb-8">
              <PanelSectionTitle text={title} />
              {metadataFields.map(({ field, config }) => {
                if (field === OBJECT_LIST_TABLE.columnIds.objectType) {
                  return <></>;
                }

                if (config) {
                  return (
                    <PanelMetadataInput
                      key={field}
                      property={field}
                      config={config}
                      control={control}
                      register={register}
                      value={getValues(field)}
                    />
                  );
                }

                return (
                  <PanelMetadataProperty
                    key={field}
                    property={field}
                    value={getValues(field)}
                  />
                );
              })}
              <PanelSeparator />
            </div>
          ))}
        </>
      )}

      {objectType.toUpperCase() === "IMAGE" && (
        <AdditionalImageMetadata
          src={metadata.url as string}
          alt={metadata.title as string}
        />
      )}
    </form>
  );
};
