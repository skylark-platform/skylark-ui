import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useImageSize } from "src/hooks/useImageSize";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField, hasProperty } from "src/lib/utils";

const objectOptions: Record<SkylarkObjectType, { fieldsToHide: string[] }> = {
  Image: {
    fieldsToHide: ["external_url", "upload_url", "download_from_url"],
  },
};

interface PanelMetadataProps {
  objectType: SkylarkObjectType;
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
    <h3 className="mb-2 font-bold ">{formatObjectField(property)}</h3>
    <div className="mb-4 text-base-content">{value ? value : "---"}</div>
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

export const PanelMetadata = ({ metadata, objectType }: PanelMetadataProps) => {
  const options =
    hasProperty(objectOptions, objectType) && objectOptions[objectType];

  const metadataProperties = options
    ? Object.keys(metadata).filter(
        (property) => !options.fieldsToHide.includes(property.toLowerCase()),
      )
    : Object.keys(metadata);

  return (
    <div className="h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      {metadata &&
        metadataProperties.map(
          (property) =>
            property !== OBJECT_LIST_TABLE.columnIds.objectType && (
              <PanelMetadataProperty
                key={property}
                property={property}
                value={metadata[property]}
              />
            ),
        )}

      {objectType.toUpperCase() === "IMAGE" && (
        <AdditionalImageMetadata
          src={metadata.url as string}
          alt={metadata.title as string}
        />
      )}
    </div>
  );
};
