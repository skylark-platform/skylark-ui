import clsx from "clsx";

import { BaseTable } from "src/components/tables/common/common";
import { ComparedEnumValue } from "src/lib/skylark/introspection/schemaComparison";

type TableRow = {
  id: string;
} & ComparedEnumValue;

interface EnumComparisonTableProps {
  rows: TableRow[];
}

export const EnumComparisonTable = ({
  rows,
  ...props
}: EnumComparisonTableProps) => {
  return (
    <BaseTable columns={[{ name: "Values", property: "value" }]} {...props}>
      {rows.map(({ id, type, value }) => {
        return (
          <tr
            key={id}
            className={clsx(
              type === "added" && "bg-success/20",
              type === "removed" && "bg-error/20",
            )}
          >
            <td
              key={id}
              className={clsx(
                "px-1 py-0.5 border",
                (!type || type === "equal") && "border-manatee-100",
                type === "removed" && "line-through border-error/5",
                type === "added" && "border-success/10",
              )}
            >
              {value}
            </td>
          </tr>
        );
      })}
    </BaseTable>
  );
};
