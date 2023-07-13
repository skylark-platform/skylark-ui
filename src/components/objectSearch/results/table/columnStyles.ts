import clsx from "clsx";

import { OBJECT_LIST_TABLE } from "src/constants/skylark";

const headAndDataClassNames =
  "overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm text-base-content";
const lastHeadAndDataClassNames =
  "last:sticky last:right-0 last:pl-0 last:h-full last:z-10 last:min-w-0 last:border-l-0";
const rowClassName = "group/row hover:bg-manatee-50 hover:border-manatee-50 ";
const inactiveClassName = "bg-white";
const activeRowClassName = "bg-manatee-100 border-manatee-100";
const rowGroupClassName =
  "group-hover/row:bg-manatee-50 group-hover/row:border-manatee-50";

const customColumnStyling: Record<
  string,
  {
    className?: {
      all?: string;
      header?: string;
      cell?: string;
      withoutCheckbox?: string;
      withCheckbox?: string;
    };
  }
> = {
  default: {
    className: { all: "pr-1 pl-px" },
  },
  [OBJECT_LIST_TABLE.columnIds.actions]: {
    className: {
      all: "bg-transparent",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.displayField]: {
    className: {
      all: "sm:sticky z-20 pl-0 [&>span]:pl-0 [&>span]:border-l-0 border-l-0 pr-1",
      withoutCheckbox: "left-6",
      withCheckbox: "left-14",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.dragIcon]: {
    className: {
      all: "px-0 hidden md:table-cell",
      cell: "",
      header: "",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.objectType]: {
    className: {
      all: "px-0",
      cell: "absolute z-30 pr-2",
      header: "sm:sticky w-10 -left-px h-5 pr-1 z-20",
    },
  },
  [OBJECT_LIST_TABLE.columnIds.checkbox]: {
    className: {
      all: "pr-0 pl-0 sm:sticky left-5",
      cell: "z-[31]",
      header: "z-40",
    },
  },
  images: {
    className: {
      all: "",
      header: "pr-1 pl-px",
      cell: "[&>div]:flex [&>div]:overflow-hidden [&>div]:h-7 [&>div]:md:h-8 pb-0 pt-0.5 md:py-0.5 [&>div]:mr-2 [&>div>img]:mr-0.5 [&>div>img]:h-full",
    },
  },
};
const columnsWithCustomStyling = Object.keys(customColumnStyling);

export const getObjectSearchTableColumnStyles = (
  columnId: string,
  type: "header" | "cell",
  opts: {
    withCheckbox?: boolean;
    rowIsActive?: boolean;
  },
) => {
  const colStyles = columnsWithCustomStyling.includes(columnId)
    ? customColumnStyling[columnId]
    : customColumnStyling.default;

  const typeSpecificClassName = colStyles?.className?.[type] || "";
  return clsx(
    columnId !== OBJECT_LIST_TABLE.columnIds.checkbox && headAndDataClassNames,
    lastHeadAndDataClassNames,
    type === "cell" && rowGroupClassName,
    type === "cell" && opts.rowIsActive && activeRowClassName,
    type === "cell" &&
      !opts.rowIsActive &&
      columnId !== OBJECT_LIST_TABLE.columnIds.actions &&
      inactiveClassName,
    type === "header" && "bg-white",
    colStyles.className?.all,
    typeSpecificClassName,
    opts?.withCheckbox
      ? colStyles.className?.withCheckbox
      : colStyles.className?.withoutCheckbox,
  );
};

export const getObjectSearchDisplayNameCellStyles = (rowIsActive: boolean) =>
  clsx(rowGroupClassName, rowIsActive ? activeRowClassName : inactiveClassName);

export const getObjectSearchTableRowStyles = (rowIsActive: boolean) =>
  clsx(rowClassName, rowIsActive ? activeRowClassName : inactiveClassName);

export const getDragIconBeforeStyles = (isDraggable?: boolean) =>
  clsx(
    "before:left-3 before:top-0 before:hidden before:h-full before:w-5 before:bg-inherit before:opacity-0 before:group-hover/row:opacity-60 md:before:absolute md:before:block",
    "before:bg-[url('/icons/drag_indicator_black.png')] before:bg-center before:bg-no-repeat",
    !isDraggable && "before:invisible",
  );
