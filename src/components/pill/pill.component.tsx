import clsx from "clsx";
import { FiX } from "react-icons/fi";

export interface PillProps {
  label: string;
  bgColor?: string;
  className?: string;
  onDelete?: () => void;
}

const twClassNameIncludes = (className: string, str: string) =>
  className.startsWith(str) || className.includes(` ${str}`);

export const Pill = ({ label, bgColor, className, onDelete }: PillProps) => (
  <div
    // TODO determine text colour based on background
    className={clsx(
      `badge whitespace-nowrap border-none px-2 text-xs text-white`,
      className,
      // Only add a default bg when one isn't given in the className
      (!className || !twClassNameIncludes(className, "bg-")) &&
        "bg-manatee-300",
    )}
    style={bgColor ? { backgroundColor: bgColor } : undefined}
  >
    <span className="overflow-hidden text-clip">{label}</span>
    {onDelete && (
      <button className="ml-1" onClick={onDelete}>
        <FiX className="h-4 w-4 text-white" />
      </button>
    )}
  </div>
);
