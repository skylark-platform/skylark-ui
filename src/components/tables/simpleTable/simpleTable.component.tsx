import clsx from "clsx";

import {
  BaseTable,
  BaseTableProps,
  BooleanTickCross,
  TableData,
} from "src/components/tables/common/common";

interface SimpleTableProps<TData extends TableData>
  extends BaseTableProps<TData> {
  rows: (TData & { id: string })[];
}

export const SimpleTable = <
  TRow extends Record<string, string | string[] | number | boolean>,
>({
  columns,
  rows,
  displayFalsyBooleanValues,
  ...props
}: SimpleTableProps<TRow>) => {
  return (
    <BaseTable columns={columns} {...props}>
      {rows.map((field) => (
        <tr key={field.id}>
          {columns.map(({ property }) => {
            const val = field[property];
            const type = typeof val;
            const isArr = Array.isArray(val);

            return (
              <td
                key={`${field.id}-${String(property)}`}
                className={clsx(
                  "px-1 py-0.5 border border-manatee-100",
                  type === "number" && "text-right",
                )}
              >
                {(type === "string" || type === "number") && val}
                {isArr && val.join(", ")}
                {type === "boolean" && (
                  <span className="w-full flex justify-center items-center">
                    <BooleanTickCross
                      value={Boolean(val)}
                      displayFalsy={displayFalsyBooleanValues}
                    />
                  </span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </BaseTable>
  );
};
