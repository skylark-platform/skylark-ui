import clsx from "clsx";

interface PanelHeaderProps {
  text: string;
  count?: string | number;
  sticky?: boolean;
}

export const PanelSectionTitle = ({
  text,
  count,
  sticky,
}: PanelHeaderProps) => (
  <h3
    className={clsx(
      "bg-white pb-0.5 text-base font-semibold underline",
      sticky ? "sticky top-0 pt-4 pb-2 md:pt-8" : "mb-2",
    )}
  >
    {count !== undefined ? `${text} (${count})` : text}
  </h3>
);

export const PanelFieldTitle = ({ text, count, sticky }: PanelHeaderProps) => (
  <h4
    className={clsx(
      "mb-1 bg-white pb-0.5 text-sm font-bold",
      sticky && "sticky top-12 pt-2 md:top-[3.6rem]",
    )}
  >
    {count !== undefined ? `${text} (${count})` : text}
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
