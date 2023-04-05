import { useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

import { SkylarkObjectFieldInput } from "src/components/inputs/skylarkObjectFieldInput";
import {
  PanelFieldTitle,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import {
  OBJECT_LIST_TABLE,
  OBJECT_OPTIONS,
  SYSTEM_FIELDS,
} from "src/constants/skylark";
import { useImageSize } from "src/hooks/useImageSize";
import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { splitMetadataIntoSystemTranslatableGlobal } from "src/lib/skylark/objects";
import { parseMetadataForHTMLForm } from "src/lib/skylark/parsers";
import { formatObjectField } from "src/lib/utils";

interface PanelMetadataProps {
  uid: string;
  language: string;
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
  <div>
    <PanelFieldTitle text={formatObjectField(property)} />
    <p className="mb-4 text-base-content">{value ? value : "---"}</p>
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
    <div className="-mt-4">
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
    </div>
  );
};

export const PanelMetadata = ({
  uid,
  language,
  metadata,
  objectType,
  objectMeta,
  form: { register, getValues, control, reset, formState },
}: PanelMetadataProps) => {
  const options = OBJECT_OPTIONS.find(({ objectTypes }) =>
    objectTypes.includes(objectType),
  );

  // When component first loads, update the form metadata with the current values
  useEffect(() => {
    reset(parseMetadataForHTMLForm(metadata, objectMeta?.fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, language]);

  const { systemMetadataFields, languageGlobalMetadataFields } = useMemo(
    () =>
      splitMetadataIntoSystemTranslatableGlobal(
        Object.keys(metadata),
        objectMeta.operations.update.inputs,
        options,
      ),
    [metadata, objectMeta.operations.update.inputs, options],
  );

  const requiredFields = objectMeta.operations.create.inputs
    .filter(({ isRequired }) => isRequired)
    .map(({ name }) => name);

  return (
    <form
      className="h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20"
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
          ].map(
            ({ id, title, metadataFields }, index, { length: numSections }) => (
              <div key={id} className="mb-8">
                <PanelSectionTitle text={title} />
                {metadataFields.map(({ field, config }) => {
                  if (config) {
                    return (
                      <SkylarkObjectFieldInput
                        key={field}
                        field={field}
                        config={config}
                        control={control}
                        register={register}
                        value={getValues(field)}
                        formState={formState}
                        additionalRequiredFields={requiredFields}
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
                {index < numSections - 1 && <PanelSeparator />}
              </div>
            ),
          )}
        </>
      )}

      {(
        [
          BuiltInSkylarkObjectType.SkylarkImage,
          BuiltInSkylarkObjectType.BetaSkylarkImage,
        ] as string[]
      ).includes(objectType) && (
        <AdditionalImageMetadata
          src={metadata.url as string}
          alt={metadata.title as string}
        />
      )}
    </form>
  );
};
