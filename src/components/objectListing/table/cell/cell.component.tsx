import { CellContext } from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useState } from "react";

export const TableCell = ({
  table,
  row,
  column,
  getValue,
}: CellContext<object, unknown>) => {
  const initialValue = getValue();
  // We need to keep and update the state of the cell normally
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [value, setValue] = useState(initialValue);

  // When the input is blurred, we'll call our table meta's updateData function
  // const onBlur = () => {
  //   table.options.meta?.updateData(index, id, value);
  // };

  // If the initialValue is changed external, sync it up with our state
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return row.id === table.options.meta?.rowInEditMode ? (
    <input
      value={(value || "") as string}
      onChange={(e) => setValue(e.target.value)}
      className={clsx(
        "w-full border-b-2 border-brand-primary py-1 outline-none disabled:border-none disabled:border-manatee-200 disabled:text-manatee-500",
        initialValue !== value && "border-warning",
        value === "" && initialValue !== "" && "border-error",
      )}
      disabled={column.id === "uid"}
    />
  ) : (
    <>{initialValue as string}</>
  );
};
