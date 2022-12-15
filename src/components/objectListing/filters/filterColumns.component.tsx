import { Table } from "@tanstack/react-table";

interface FilterColumnsProps {
  table: Table<object>;
}

export const ColumnFilter = ({ table }: FilterColumnsProps) => {
  return (
    <div className="my-14 grid grid-flow-row grid-cols-3 text-sm md:w-1/2">
      {table.getAllLeafColumns().map((column) => {
        return (
          <div key={column.id} className="px-1">
            <label>
              <input
                {...{
                  type: "checkbox",
                  checked: column.getIsVisible(),
                  onChange: column.getToggleVisibilityHandler(),
                }}
              />{" "}
              {column.id}
            </label>
          </div>
        );
      })}
    </div>
  );
};
