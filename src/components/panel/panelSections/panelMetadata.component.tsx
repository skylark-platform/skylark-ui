import { useMemo } from "react";

import {
  PanelFieldTitle,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useImageSize } from "src/hooks/useImageSize";
import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

const systemFields: string[] = [
  SkylarkSystemField.UID,
  SkylarkSystemField.ExternalID,
  SkylarkSystemField.Slug,
];
const objectOptions: {
  objectTypes: SkylarkObjectType[];
  fieldsToHide: string[];
}[] = [
  // {
  //   objectTypes: [
  //     BuiltInSkylarkObjectType.SkylarkImage,
  //     BuiltInSkylarkObjectType.BetaSkylarkImage,
  //   ],
  //   fieldsToHide: ["external_url", "upload_url", "download_from_url"],
  // },
];

interface PanelMetadataProps {
  objectType: SkylarkObjectType;
  objectMeta: SkylarkObjectMeta;
  metadata: Record<string, SkylarkObjectMetadataField>;
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
  metadata,
  objectType,
  objectMeta,
}: PanelMetadataProps) => {
  const options = objectOptions.find(({ objectTypes }) =>
    objectTypes.includes(objectType),
  );

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
    <div
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
                {metadataFields.map(
                  ({ field }) =>
                    field !== OBJECT_LIST_TABLE.columnIds.objectType && (
                      <PanelMetadataProperty
                        key={field}
                        property={field}
                        value={metadata[field]}
                      />
                    ),
                )}
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
    </div>
  );
};
