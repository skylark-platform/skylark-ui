import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const ArrowLeft = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        d="M20 12H4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18L4 12L10 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};

export const ArrowRight = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        d="M4 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 6L20 12L14 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};
