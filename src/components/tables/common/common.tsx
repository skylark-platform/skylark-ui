import clsx from "clsx";
import { ReactNode } from "react";
import { FiCheck, FiX } from "react-icons/fi";

export type TableData = Record<string, string | boolean | number | string[]>;

export interface BaseTableProps<TData extends TableData> {
  columns: { property: keyof TData; name: string }[];
  displayFalsyBooleanValues?: boolean;
  className?: string;
}

export const BooleanTickCross = ({
  value,
  displayFalsy,
}: {
  value?: boolean | null;
  displayFalsy?: boolean;
}) =>
  value ? (
    <FiCheck className="text-lg" />
  ) : displayFalsy ? (
    <FiX className="text-lg" />
  ) : null;

const BaseTableHeader = <TData extends TableData>({
  columns,
}: Pick<BaseTableProps<TData>, "columns">) => (
  <thead className="text-black">
    {columns.map(({ property, name }) => (
      <th
        key={String(property)}
        className="p-1 border border-manatee-200 font-medium"
      >
        {name}
      </th>
    ))}
  </thead>
);

export const BaseTable = <TData extends TableData>({
  children,
  columns,
  className,
}: Pick<BaseTableProps<TData>, "columns"> &
  Pick<BaseTableProps<TData>, "className"> & { children: ReactNode }) => (
  <table className={clsx("w-full border border-manatee-200", className)}>
    <BaseTableHeader columns={columns} />
    <tbody className="p-2">{children}</tbody>
  </table>
);
