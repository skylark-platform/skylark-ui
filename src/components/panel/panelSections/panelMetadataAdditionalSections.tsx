import { Select, SelectOption } from "src/components/inputs/select";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useImageSize } from "src/hooks/useImageSize";
import { SkylarkObjectMetadataField } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

export const PanelMetadataProperty = ({
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

export const AvailabilityDimensions = ({ uid }: { uid: string }) => {
  const { dimensions } = useAvailabilityDimensionsWithValues();
  console.log({ dimensions });
  return (
    <div className="-mt-4">
      {/* <PanelSectionTitle text="Dimensions" /> */}
      {dimensions?.map((dimension) => {
        const options: SelectOption[] = dimension.values.map(
          (value): SelectOption => ({
            label: value.title || value.slug || value.external_id || value.uid,
            value: value.uid,
          }),
        );
        const title =
          formatObjectField(
            dimension.title || dimension.slug || dimension.external_id || "",
          ) || dimension.uid;
        return (
          <div key={dimension.uid} className="my-6">
            <PanelFieldTitle text={title} />
            <Select
              variant="primary"
              options={options}
              placeholder={title}
              withBasicSort
              withSearch
            />
          </div>
        );
      })}
    </div>
  );
};
