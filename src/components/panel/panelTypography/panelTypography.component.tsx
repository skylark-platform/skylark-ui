import clsx from "clsx";
import { CgSpinner } from "react-icons/cg";
import { FiPlus } from "react-icons/fi";

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
        "bg-base-100 text-base font-semibold underline inline-block",
        sticky ? "sticky top-0 z-[2] pb-2 pt-4 md:pt-8" : "mb-2 pb-1 md:pb-2",
      )}
    >
      {count !== undefined && !loading ? `${text} (${count})` : text}
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
      "group/header mb-1 flex items-center bg-base-100 pb-0.5 text-sm font-bold",
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

export const PanelSeparator = ({
  transparent,
  className,
}: {
  transparent?: boolean;
  className?: string;
}) => (
  <span
    className={clsx(
      "flex h-px w-full flex-grow",
      transparent ? "bg-transparent" : "bg-manatee-100",
      className,
    )}
  />
);

export const PanelPlusButton = ({ onClick }: { onClick: () => void }) => (
  <button
    className="mb-4 px-2 py-1 text-manatee-500 transition-colors hover:text-brand-primary"
    onClick={onClick}
  >
    <FiPlus className="h-4 w-4" />
  </button>
);
