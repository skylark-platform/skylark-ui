import clsx from "clsx";

export interface PillProps {
  label: string;
  bgColor?: string;
  className?: string;
}

export const Pill = ({ label, bgColor, className }: PillProps) => (
  <span
    // TODO determine text colour based on background
    className={clsx(`badge border-none px-3 text-xs text-white`, className)}
    style={bgColor ? { backgroundColor: bgColor } : undefined}
  >
    {label}
  </span>
);
