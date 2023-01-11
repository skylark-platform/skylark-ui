import { CellContext } from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState } from "react";

export const TableCell = ({
  table,
  row,
  column,
  getValue,
  ...props
}: CellContext<object, unknown>) => {
  const initialValue = getValue<string | number | boolean | null>();
  // We need to keep and update the state of the cell normally
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // const [value, setValue] = useState<string | number | boolean | null>(
  //   initialValue,
  // );

  // When the input is blurred, we'll call our table meta's updateData function
  // const onBlur = () => {
  //   table.options.meta?.updateData(index, id, value);
  // };
  // const onBlur = () => {
  //   table.options.meta?.updateEditingObjectData(column.id, value);
  //   console.log({ table, row, column, ...props });
  // };

  // If the initialValue is changed external, sync it up with our state
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    table.options.meta?.updateEditingObjectData(column.id, initialValue);
  }, [column.id, initialValue, table.options.meta]);

  return row.id === table.options.meta?.rowInEditMode ? (
    <input
      onBlur={onBlur}
      value={
        (table.options.meta?.editingObjectData[column.id] as string) ||
        (initialValue as string)
      }
      onChange={(e) =>
        table.options.meta?.updateEditingObjectData(column.id, e.target.value)
      }
      className={clsx(
        "w-full border-b-2 border-brand-primary py-1 outline-none disabled:border-none disabled:border-manatee-200 disabled:text-manatee-500",
        initialValue !== table.options.meta?.editingObjectData[column.id] &&
          "border-warning",
        table.options.meta?.editingObjectData[column.id] === "" &&
          initialValue !== "" &&
          "border-error",
      )}
      disabled={column.id === "uid"}
    />
  ) : (
    <>{initialValue as string}</>
  );
};
