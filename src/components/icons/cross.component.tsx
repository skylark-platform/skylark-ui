import clsx from "clsx";

import { IconBase, IconProps } from "./iconBase.component";

export const CrossSquare = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        stroke="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        stroke="currentColor"
        d="M9 9L15 15"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        stroke="currentColor"
        d="M15 9L9 15"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};

export const Cross = ({ className }: IconProps) => {
  return (
    <IconBase className={clsx("stroke-black", className)}>
      <path
        d="M18 6L6 18"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        d="M6 6L18 18"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </IconBase>
  );
};

export const CrossCircle = ({ className }: IconProps) => {
  return (
    <IconBase
      className={clsx("stroke-black", className)}
      width="30"
      height="28"
      viewBox="0 0 30 24"
    >
      <g filter="url(#filter0_d_308_1217)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15 22C20.5228 22 25 17.5228 25 12C25 6.47715 20.5228 2 15 2C9.47715 2 5 6.47715 5 12C5 17.5228 9.47715 22 15 22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 9L12 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 9L18 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </IconBase>
  );
};
