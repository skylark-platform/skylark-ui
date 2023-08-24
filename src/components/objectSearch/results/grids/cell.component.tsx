import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import {
  is2038Problem,
  formatReadableDate,
} from "src/lib/skylark/availability";

export interface CellProps {
  objectType: SkylarkObjectType;
  field: NormalizedObjectField;
  value: string;
  columnId: string;
}

export const Cell = ({
  objectType,
  field: { type, enumValues },
  value,
  columnId,
}: CellProps) => {
  // Pretty format dates
  if (type === "datetime" || type === "date" || type === "timestamp") {
    return <>{is2038Problem(value) ? "Never" : formatReadableDate(value)}</>;
  }

  // Align numbers to the right
  if (type === "float" || type === "int") {
    return <span className="mr-1 block text-right">{value}</span>;
  }

  // Its possible for enum values to be removed from the Schema but exist as values, we can flag these as red
  if (type === "enum" && enumValues && !enumValues.includes(value)) {
    return <span className="text-error">{value}</span>;
  }

  // Make URLs clickable to a new tab, little bit hardcoded to handle the SkylarkImage object
  if (
    type === "url" ||
    (objectType === BuiltInSkylarkObjectType.SkylarkImage &&
      ["url", "external_url"].includes(columnId))
  ) {
    return (
      <a
        className="text-brand-primary hover:underline"
        href={value}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
    );
  }

  return <>{value}</>;
};
