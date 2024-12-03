import clsx from "clsx";
import { ReactNode } from "react";
import { IconType } from "react-icons";
import { FiInfo, FiX } from "react-icons/fi";

import { Tooltip } from "src/components/tooltip/tooltip.component";

export interface PillProps {
  Icon?: IconType;
  label: ReactNode;
  bgColor?: string | null;
  className?: string;
  infoTooltip?: ReactNode;
  onDelete?: () => void;
}

const twClassNameIncludes = (className: string, str: string) =>
  className.startsWith(str) || className.includes(` ${str}`);

export const Pill = ({
  label,
  bgColor,
  className,
  infoTooltip,
  Icon,
  onDelete,
}: PillProps) => (
  <div
    // TODO determine text colour based on background
    className={clsx(
      `badge whitespace-nowrap border-none text-xs text-white relative`,
      Icon ? "px-3" : "px-2",
      className,
      // Only add a default bg when one isn't given in the className
      (!className || !twClassNameIncludes(className, "bg-")) &&
        "bg-manatee-300",
    )}
    style={bgColor ? { backgroundColor: bgColor } : undefined}
    data-cy="pill"
  >
    {Icon && (
      <div className="pl-1 absolute left-0 bg-inherit rounded-full text-xs">
        <Icon />
      </div>
    )}
    <span className={clsx("overflow-hidden text-clip", Icon && "ml-1")}>
      {label}
    </span>
    {onDelete && (
      <button className="ml-1" onClick={onDelete}>
        <FiX className="h-4 w-4 text-white" />
      </button>
    )}
    {infoTooltip && (
      <Tooltip tooltip={infoTooltip}>
        <div className="ml-1">
          <FiInfo className="text-sm" />
        </div>
      </Tooltip>
    )}
  </div>
);
