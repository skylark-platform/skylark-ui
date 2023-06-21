import { CellContext } from "@tanstack/react-table";
import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";

export const getCellWidths = (width: number) => ({
  width,
  minWidth: width,
  maxWidth: width,
});

interface DisplayNameTableCellProps {
  id: string;
  colour?: string;
  className: string;
  rowGroupClassName: string;
  children: ReactNode | JSX.Element;
  width: number;
  height: number;
  isDraggable?: boolean;
}

export const DisplayNameTableCell = ({
  id,
  colour,
  className,
  rowGroupClassName,
  children,
  width,
  height,
  isDraggable,
}: DisplayNameTableCellProps) => {
  return (
    <td
      key={id}
      className={`${className} overflow-visible`}
      style={{ ...getCellWidths(width), height }}
    >
      <div
        className={`absolute z-30 -ml-11 -mt-[0.6rem] hidden h-full items-center bg-white px-1 sm:flex ${rowGroupClassName}`}
      >
        <div
          className={clsx(
            "relative h-6 w-2.5 border-r-4 border-r-manatee-300 pl-8",
            "before:left-3 before:top-0 before:hidden before:h-full before:w-5 before:bg-inherit before:opacity-0 before:group-hover/row:opacity-60 md:before:absolute md:before:block",
            "before:bg-[url('/icons/drag_indicator_black.png')] before:bg-center before:bg-no-repeat",
            !isDraggable && "before:invisible",
          )}
          style={{ borderRightColor: colour }}
        />
      </div>
      <div className="w-full overflow-hidden text-ellipsis">{children}</div>
    </td>
  );
};

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
