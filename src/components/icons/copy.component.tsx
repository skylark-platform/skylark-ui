import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const Copy = ({ className }: IconProps) => {
  return (
    <IconBase
      className={clsx("stroke-black", className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M9 11C9 9.89543 9.89543 9 11 9H20C21.1046 9 22 9.89543 22 11V20C22 21.1046 21.1046 22 20 22H11C9.89543 22 9 21.1046 9 20V11Z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </IconBase>
  );
};
