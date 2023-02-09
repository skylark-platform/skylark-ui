import { IconBase, IconProps } from "./iconBase.component";

export const Edit = ({ className }: IconProps) => {
  return (
    <IconBase className={className}>
      <path
        d="M21 13.66V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H10.34"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 2L22 6L12 16H8V12L18 2V2Z"
        strokeWidth="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
};

export const Edit3 = ({ className }: IconProps) => {
  return (
    <IconBase className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 2L18 6L7 17H3V13L14 2V2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M3 22H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </IconBase>
  );
};
