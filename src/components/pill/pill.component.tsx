import clsx from "clsx";

export interface PillProps {
  label: string;
  bgColor?: string;
  className?: string;
}

export const Pill = ({ label, bgColor, className }: PillProps) => (
  <div
    // TODO determine text colour based on background
    className={clsx(
      `badge border-none bg-brand-primary px-2 text-xs text-white`,
      className,
    )}
    style={bgColor ? { backgroundColor: bgColor } : undefined}
  >
    <span className="overflow-hidden text-clip">{label}</span>
  </div>
);
