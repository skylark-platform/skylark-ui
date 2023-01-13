import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const Search = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
        stroke="#0E1825"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 21L15.8 15.8"
        stroke="#0E1825"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};
