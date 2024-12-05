import {
  MultiSelectOption,
  MultiSelect,
} from "src/components/inputs/multiselect/multiselect.component";
import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { ParsedSkylarkDimensionWithValues } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface DimensionMultiSelectProps {
  dimension: ParsedSkylarkDimensionWithValues;
  selected: string[];
  segmentValues?: string[];
  onChange: (dimension: string, values: string[]) => void;
}

export const DimensionMultiSelect = ({
  dimension,
  selected,
  segmentValues,
  onChange,
}: DimensionMultiSelectProps) => {
  const title = formatObjectField(dimension.title || dimension.slug);

  const options: MultiSelectOption[] = dimension.values
    .map((value): MultiSelectOption => {
      const isInheritedFromSegment = segmentValues?.includes(value.slug);

      return {
        label: value.title || value.slug,
        value: value.slug,
        infoTooltip:
          isInheritedFromSegment && "Inherited from an AvailabilitySegment",
        disabled: isInheritedFromSegment,
      };
    })
    .sort();

  const onChangeWrapper = (updatedSelectedValues: string[]) => {
    onChange(dimension.slug, updatedSelectedValues);
  };

  return (
    <div className="mb-6">
      <PanelFieldTitle text={title} id={`dimensions-panel-${dimension.uid}`} />

      <MultiSelect
        renderInPortal
        options={options}
        selected={selected}
        onChange={onChangeWrapper}
        placeholder="Any"
        hidePlaceholderWhenSelected
      />
    </div>
  );
};
