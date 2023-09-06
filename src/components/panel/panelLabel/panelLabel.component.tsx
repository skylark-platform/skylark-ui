import clsx from "clsx";
import { CgSpinner } from "react-icons/cg";

interface PanelLabelProps {
  text: string;
  warning?: boolean;
  loading?: boolean;
}

export const PanelLabel = ({ loading, text, warning }: PanelLabelProps) => (
  <span
    className={clsx(
      "flex items-center justify-center rounded  py-1 text-xs  md:text-sm",
      warning ? "bg-brand-primary text-white" : "bg-black text-white",
      loading ? "px-2 md:px-3" : "px-3 md:px-4",
    )}
  >
    {loading && (
      <CgSpinner className="mr-1 animate-spin-fast text-sm md:text-base" />
    )}
    {text}
  </span>
);
