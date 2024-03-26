import clsx from "clsx";
import { ReactNode } from "react";
import { CgSpinner } from "react-icons/cg";

interface TagProps {
  warning?: boolean;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

export const Tag = ({ loading, children, warning, className }: TagProps) => (
  <span
    className={clsx(
      "flex items-center justify-center rounded  py-1 text-xs  md:text-sm",
      className,
      warning
        ? "bg-warning font-medium text-warning-content"
        : "bg-black text-white",
      loading ? "px-2 md:px-3" : "px-3 md:px-4",
    )}
  >
    {loading && (
      <CgSpinner className="mr-1 animate-spin-fast text-sm md:text-base" />
    )}
    {children}
  </span>
);
