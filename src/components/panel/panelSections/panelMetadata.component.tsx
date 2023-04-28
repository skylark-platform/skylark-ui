import { useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

import { SkylarkObjectFieldInput } from "src/components/inputs/skylarkObjectFieldInput";
import {
  PanelFieldTitle,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { OBJECT_OPTIONS } from "src/constants/skylark";
import { useImageSize } from "src/hooks/useImageSize";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { splitMetadataIntoSystemTranslatableGlobal } from "src/lib/skylark/objects";
import { parseMetadataForHTMLForm } from "src/lib/skylark/parsers";
import { formatObjectField } from "src/lib/utils";

import {
  AdditionalImageMetadata,
  AvailabilityDimensions,
  PanelMetadataProperty,
} from "./panelMetadataAdditionalSections";
import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelMetadataProps {
  isPage?: boolean;
  uid: string;
  language: string;
  objectType: SkylarkObjectType;
  objectMeta: SkylarkObjectMeta;
  metadata: Record<string, SkylarkObjectMetadataField>;
  form: UseFormReturn<Record<string, SkylarkObjectMetadataField>>;
}

export const PanelMetadata = ({
  isPage,
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

  const {
    systemMetadataFields,
    translatableMetadataFields,
    globalMetadataFields,
  } = useMemo(
    () =>
      splitMetadataIntoSystemTranslatableGlobal(
        Object.keys(metadata),
        objectMeta.operations.update.inputs,
        objectMeta.fieldConfig,
        options,
      ),
    [
      metadata,
      objectMeta.fieldConfig,
      objectMeta.operations.update.inputs,
      options,
    ],
  );

  const requiredFields = objectMeta.operations.create.inputs
    .filter(({ isRequired }) => isRequired)
    .map(({ name }) => name);

  const sections = [
    {
      id: "system",
      title: "System Metadata",
      metadataFields: systemMetadataFields,
    },
    {
      id: "translatable",
      title: "Translatable Metadata",
      metadataFields: translatableMetadataFields,
    },
    {
      id: "global",
      title: "Global Metadata",
      metadataFields: globalMetadataFields,
    },
  ].filter(({ metadataFields }) => metadataFields.length > 0);

  const sideBarSections = sections.map(({ id, title }) => ({ id, title }));

  return (
    <PanelSectionLayout sections={sideBarSections} isPage={isPage}>
      <form className="h-full" data-testid="panel-metadata">
        {metadata && (
          <>
            {sections.map(
              (
                { id, title, metadataFields },
                index,
                { length: numSections },
              ) => (
                <div key={id} className="mb-8 md:mb-10">
                  <PanelSectionTitle id={id} text={title} />
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
            src={metadata.url as string | null}
            alt={metadata.title as string}
          />
        )}

        {objectType === BuiltInSkylarkObjectType.Availability && (
          <AvailabilityDimensions uid={uid} />
        )}
      </form>
    </PanelSectionLayout>
  );
};
