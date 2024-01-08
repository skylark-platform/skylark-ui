import clsx from "clsx";
import { Ref, forwardRef } from "react";
import { CgSpinner } from "react-icons/cg";
import {
  FiBookOpen,
  FiMaximize2,
  FiMinimize2,
  FiPlus,
  FiX,
} from "react-icons/fi";

import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";

interface PanelHeaderProps {
  text: string;
  id?: string;
  count?: string | number;
  sticky?: boolean;
  withCopyValue?: boolean;
  copyValue?: string | number | true | JSX.Element | string[];
}

export const PanelSectionTitle = ({
  text,
  id,
  count,
  sticky,
  loading,
}: PanelHeaderProps & { loading?: boolean }) => (
  <>
    <h3
      id={id}
      className={clsx(
        "bg-white text-base font-semibold inline-block",
        sticky ? "sticky top-0 z-[2] pb-2 pt-4 md:pt-8" : "mb-2 pb-1 md:pb-2",
      )}
    >
      <span className="underline">{text}</span>
      {count !== undefined && !loading && ` (${count})`}
      {loading && (
        <CgSpinner className="inline-block ml-2 animate-spin h-4 w-4 mb-0.5" />
      )}
    </h3>
  </>
);

export const PanelFieldTitle = ({
  text,
  id,
  count,
  sticky,
  withCopyValue,
  copyValue,
}: PanelHeaderProps) => (
  <h4
    id={id}
    className={clsx(
      "group/header mb-1 flex items-center bg-white pb-0.5 text-sm font-bold",
      sticky && "sticky top-12 pt-2 md:top-[3.6rem]",
    )}
  >
    {count !== undefined ? `${text} (${count})` : text}
    {withCopyValue && (
      <CopyToClipboard
        value={copyValue}
        className="invisible group-hover/header:visible"
      />
    )}
  </h4>
);

export const PanelEmptyDataText = () => (
  <p className="text-sm text-manatee-500">None</p>
);

export const PanelSeparatorComponent = (
  {
    transparent,
    className,
  }: {
    transparent?: boolean;
    className?: string;
  },
  ref: Ref<HTMLSpanElement>,
) => (
  <span
    ref={ref}
    className={clsx(
      "flex h-px w-full flex-grow",
      transparent ? "bg-transparent" : "bg-manatee-100",
      className,
    )}
  />
);
export const PanelSeparator = forwardRef(PanelSeparatorComponent);

export const PanelButton = ({
  onClick,
  type,
  className,
  ...props
}: {
  onClick: () => void;
  type: "plus" | "maximise" | "minimise" | "x";
  className?: string;
}) => (
  <button
    {...props}
    className={clsx(
      "mb-4 px-1 py-1 text-manatee-500 transition-colors hover:text-brand-primary",
      className,
    )}
    onClick={onClick}
  >
    {type === "plus" && <FiPlus className="h-4 w-4" />}
    {type === "maximise" && <FiMaximize2 className="h-4 w-4" />}
    {type === "minimise" && <FiMinimize2 className="h-4 w-4" />}
    {type === "x" && <FiX className="h-4 w-4" />}
  </button>
);
