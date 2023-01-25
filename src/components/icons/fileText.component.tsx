import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const FileText = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)} width="20">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        stroke="#0E1825"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M14 2V8H20"
        stroke="#0E1825"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M16 13H8"
        stroke="#0E1825"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M16 17H8"
        stroke="#0E1825"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10 9H9H8"
        stroke="#0E1825"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </IconBase>
  );
};
