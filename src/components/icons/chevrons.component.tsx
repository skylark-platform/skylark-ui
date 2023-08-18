import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const ChevronLeft = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};

export const ChevronRight = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};
