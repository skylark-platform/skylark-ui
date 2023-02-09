import { IconBase, IconProps } from "./iconBase.component";

export const PlusSquare = ({ className }: IconProps) => {
  return (
    <IconBase className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        fill="none"
      />
      <path
        d="M12 8V16"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        fill="none"
      />
      <path
        d="M8 12H16"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        fill="none"
      />
    </IconBase>
  );
};

export const Plus = ({ className }: IconProps) => {
  return (
    <IconBase className={className} viewBox="3 3 18 18">
      <path
        d="M12 5V19"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        fill="none"
      />
      <path
        d="M5 12H19"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        fill="none"
      />
    </IconBase>
  );
};
