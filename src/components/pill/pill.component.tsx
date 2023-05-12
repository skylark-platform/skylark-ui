import clsx from "clsx";

import { Cross } from "src/components/icons";

export interface PillProps {
  label: string;
  bgColor?: string;
  className?: string;
  onDelete?: () => void;
}

export const Pill = ({ label, bgColor, className, onDelete }: PillProps) => (
  <div
    // TODO determine text colour based on background
    className={clsx(
      `badge whitespace-nowrap border-none px-2 text-xs text-white`,
      className,
    )}
    style={bgColor ? { backgroundColor: bgColor } : undefined}
  >
    <span className="overflow-hidden text-clip">{label}</span>
    {onDelete && (
      <button className="ml-1" onClick={onDelete}>
        <Cross className="h-4 w-4 text-xs text-white" />
      </button>
    )}
  </div>
);
