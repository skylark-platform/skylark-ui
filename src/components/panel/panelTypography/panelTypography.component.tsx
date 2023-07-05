import clsx from "clsx";

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
}: PanelHeaderProps) => (
  <h3
    id={id}
    className={clsx(
      "bg-white pb-1 text-base font-semibold underline md:pb-2 md:text-lg",
      sticky ? "sticky top-0 z-[2] pb-2 pt-4 md:pt-8" : "mb-2",
    )}
  >
    {count !== undefined ? `${text} (${count})` : text}
  </h3>
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

export const PanelSeparator = ({ transparent }: { transparent?: boolean }) => (
  <span
    className={clsx(
      "flex h-px w-full flex-grow",
      transparent ? "bg-transparent" : "bg-manatee-100",
    )}
  />
);
