import clsx from "clsx";

import {
  BaseTable,
  BaseTableProps,
  BooleanTickCross,
  TableData,
} from "src/components/tables/common/common";

type TableRow<TData extends TableData> = {
  id: string;
  from: TData | null;
  to: TData | null;
  modifiedProperties?: string[];
};

interface ObjectComparisonTableProps<TData extends TableData>
  extends BaseTableProps<TData> {
  rows: TableRow<TData>[];
}

const calculateDiffType = <TData extends TableData>({
  from,
  to,
  modifiedProperties,
}: Pick<TableRow<TData>, "from"> &
  Pick<TableRow<TData>, "to"> &
  Pick<TableRow<TData>, "modifiedProperties">): {
  type: "added" | "removed" | "equal" | "modified";
  modifiedProperties: string[];
} => {
  if (from && !to) {
    return { type: "removed", modifiedProperties: [] };
  }

  if (to && !from) {
    return { type: "added", modifiedProperties: [] };
  }

  // Should never hit this case
  if (!to || !from) {
    return {
      type: "equal",
      modifiedProperties: modifiedProperties || [],
    };
  }

  // Allow modifiedProperties to be passed in to skip the array checking
  if (modifiedProperties) {
    return {
      type: modifiedProperties.length === 0 ? "equal" : "modified",
      modifiedProperties,
    };
  }

  const calculatedModifiedProperties = Object.entries(from)
    .filter(([key, value]) => to?.[key] !== value)
    .map(([key]) => key);
  return {
    type: calculatedModifiedProperties.length === 0 ? "equal" : "modified",
    modifiedProperties: calculatedModifiedProperties,
  };
};

export const ObjectComparisonTable = <TRow extends TableData>({
  columns,
  rows,
  displayFalsyBooleanValues,
  ...props
}: ObjectComparisonTableProps<TRow>) => {
  return (
    <BaseTable columns={columns} {...props}>
      {rows.map(
        ({ id, to, from, modifiedProperties: propModifiedProperties }) => {
          const { type: overallDiffType, modifiedProperties } =
            calculateDiffType({
              to,
              from,
              modifiedProperties: propModifiedProperties,
            });
          return (
            <tr
              key={id}
              className={clsx(
                overallDiffType === "added" && "bg-success/20",
                overallDiffType === "removed" && "bg-error/20",
                overallDiffType === "modified" && "bg-warning/20",
              )}
            >
              {columns.map(({ property }) => {
                const fromVal = from?.[property];
                const toVal = to?.[property];
                const type = typeof fromVal || typeof toVal;

                const valueIsModified = modifiedProperties.includes(
                  String(property),
                );

                return (
                  <td
                    key={`${id}-${String(property)}`}
                    className={clsx(
                      "px-1 py-0.5 border",
                      (!overallDiffType || overallDiffType === "equal") &&
                        "border-manatee-100",
                      overallDiffType === "removed" &&
                        "line-through border-error/5",
                      overallDiffType === "added" && "border-success/10",
                      overallDiffType === "modified" && "border-warning/10",
                    )}
                  >
                    {type === "boolean" ? (
                      <span className="flex items-center">
                        {valueIsModified ? (
                          <>
                            <BooleanTickCross
                              displayFalsy
                              value={Boolean(fromVal)}
                            />{" "}
                            <span>{`->`}</span>{" "}
                            <BooleanTickCross
                              displayFalsy
                              value={Boolean(toVal)}
                            />
                          </>
                        ) : (
                          <BooleanTickCross
                            displayFalsy={displayFalsyBooleanValues}
                            value={Boolean(
                              overallDiffType === "added" ? toVal : fromVal,
                            )}
                          />
                        )}
                      </span>
                    ) : (
                      <>
                        {overallDiffType === "modified" &&
                          (valueIsModified
                            ? `${fromVal} -> ${toVal}`
                            : fromVal)}
                        {(overallDiffType === "equal" ||
                          overallDiffType === "removed") &&
                          fromVal}
                        {overallDiffType === "added" && toVal}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        },
      )}
    </BaseTable>
  );
};
