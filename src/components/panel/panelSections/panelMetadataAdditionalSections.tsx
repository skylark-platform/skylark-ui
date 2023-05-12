import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { useImageSize } from "src/hooks/useImageSize";
import { SkylarkObjectMetadataField } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

export const PanelMetadataProperty = ({
  property,
  value,
  isLoading,
}: {
  property: string;
  value?: JSX.Element | SkylarkObjectMetadataField;
  isLoading?: boolean;
}) => (
  <div>
    <PanelFieldTitle text={formatObjectField(property)} />
    {isLoading ? (
      <Skeleton className="mb-4 h-5 w-full" />
    ) : (
      <p className="mb-4 text-base-content">{value ? value : "---"}</p>
    )}
  </div>
);

export const AdditionalImageMetadata = ({
  src,
  alt,
}: {
  src: string | null;
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
          src ? <img src={src} alt={alt} /> : undefined
        }
      />
    </div>
  );
};
