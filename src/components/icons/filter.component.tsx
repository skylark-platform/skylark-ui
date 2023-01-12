import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const Filter = ({ className }: IconProps) => {
  return (
    <IconBase
      className={clsx("fill-black", className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 2.5H14V4H2V2.5ZM4 7.25H12V8.75H4V7.25ZM10 12H6V13.5H10V12Z"
      />
    </IconBase>
  );
};
