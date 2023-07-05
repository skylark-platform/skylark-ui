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
  <div className="group/copy-to-clipboard">
    <PanelFieldTitle
      text={formatObjectField(property)}
      withCopyValue
      copyValue={value || undefined}
    />
    {isLoading ? (
      <Skeleton className="mb-4 h-5 w-full" />
    ) : (
      <p className="relative mb-4 flex text-base-content">
        {value ? value : "---"}
      </p>
    )}
  </div>
);

export const CalculatedImageSize = ({ src }: { src: string | null }) => {
  const { size } = useImageSize(src);
  return (
    <div className="-mt-6">
      <PanelMetadataProperty
        property="Original Size"
        value={size ? `${size?.w}x${size?.h}` : ""}
      />
    </div>
  );
};

export const RenderedImage = ({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) => {
  return (
    <div className="mb-6 flex w-full items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img className="max-h-64" src={src} alt={alt} />}
    </div>
  );
};
