import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const CheckSquare = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        d="M8 11L11 14L22 3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12V19C20 20.1046 19.1046 21 18 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H15"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};
