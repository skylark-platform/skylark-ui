import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

import { SkylarkObjectFieldInput } from "src/components/inputs/skylarkObjectFieldInput";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { OBJECT_OPTIONS } from "src/constants/skylark";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { splitMetadataIntoSystemTranslatableGlobal } from "src/lib/skylark/objects";

import {
  CalculatedImageSize,
  PanelMetadataProperty,
  RenderedImage,
} from "./panelMetadataAdditionalSections";
import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelMetadataProps {
  isPage?: boolean;
  isLoading?: boolean;
  uid: string;
  language: string;
  objectType: SkylarkObjectType;
  objectMeta: SkylarkObjectMeta | null;
  metadata: Record<string, SkylarkObjectMetadataField> | null;
  objectFieldConfig?: ParsedSkylarkObjectConfig["fieldConfig"];
  form: UseFormReturn<Record<string, SkylarkObjectMetadataField>>;
}

export const PanelMetadata = ({
  isPage,
  isLoading,
  metadata,
  objectType,
  objectMeta,
  objectFieldConfig: objectFieldConfigArr,
  form: { register, getValues, control, formState },
}: PanelMetadataProps) => {
  const {
    systemMetadataFields,
    translatableMetadataFields,
    globalMetadataFields,
  } = useMemo(() => {
    const options = OBJECT_OPTIONS.find(({ objectTypes }) =>
      objectTypes.includes(objectType),
    );

    return objectMeta
      ? splitMetadataIntoSystemTranslatableGlobal(
          objectMeta.fields.map(({ name }) => name),
          objectMeta.operations.update.inputs,
          objectMeta.fieldConfig,
          objectFieldConfigArr,
          options,
        )
      : {
          systemMetadataFields: [],
          translatableMetadataFields: [],
          globalMetadataFields: [],
        };
  }, [objectMeta, objectType, objectFieldConfigArr]);

  const requiredFields = objectMeta?.operations.create.inputs
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
      {objectMeta?.isImage && metadata?.url && (
        <RenderedImage
          src={metadata?.url as string | null}
          alt={metadata?.title as string}
        />
      )}
      <form
        className="h-full"
        data-testid="panel-metadata"
        data-loading={isLoading}
      >
        {sections.map(
          ({ id, title, metadataFields }, index, { length: numSections }) => (
            <div key={id} className="mb-8 md:mb-10">
              <PanelSectionTitle id={id} text={title} />
              {metadataFields.map(({ field, config }) => {
                const fieldConfigFromObject = objectFieldConfigArr?.find(
                  ({ name }) => name === field,
                );

                if (config) {
                  return (
                    <SkylarkObjectFieldInput
                      idPrefix="panel-metadata"
                      isLoading={isLoading}
                      key={field}
                      field={field}
                      config={config}
                      control={control}
                      register={register}
                      value={getValues(field)}
                      formState={formState}
                      additionalRequiredFields={requiredFields}
                      fieldConfigFromObject={fieldConfigFromObject}
                    />
                  );
                }

                return (
                  <PanelMetadataProperty
                    key={field}
                    property={field}
                    value={getValues(field)}
                    isLoading={isLoading}
                  />
                );
              })}
              {index < numSections - 1 && <PanelSeparator />}
            </div>
          ),
        )}

        {objectType === BuiltInSkylarkObjectType.SkylarkImage && (
          <CalculatedImageSize src={metadata?.url as string | null} />
        )}
      </form>
      <PanelLoading isLoading={!objectMeta}>
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="mb-2 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="mb-2 mt-6 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="mb-2 mt-6 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
      </PanelLoading>
    </PanelSectionLayout>
  );
};
