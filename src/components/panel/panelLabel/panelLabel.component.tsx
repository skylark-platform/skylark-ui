import clsx from "clsx";
import { CgSpinner } from "react-icons/cg";

interface PanelLabelProps {
  text: string;
  loading?: boolean;
}

export const PanelLabel = ({ loading, text }: PanelLabelProps) => (
  <span
    className={clsx(
      "flex items-center justify-center rounded bg-black py-1 text-xs text-white md:text-sm",
      loading ? "px-2 md:px-3" : "px-3 md:px-4",
    )}
  >
    {loading && (
      <CgSpinner className="mr-1 animate-spin-fast text-sm md:text-base" />
    )}
    {text}
  </span>
);
