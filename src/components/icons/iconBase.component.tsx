import { ReactNode } from "react";

export interface IconProps {
  className?: string;
  width?: string;
  height?: string;
  viewBox?: string;
}

export const IconBase = ({
  className,
  children,
  width,
  height,
  viewBox,
}: IconProps & { children: ReactNode }) => (
  <svg
    className={className}
    width={width || "24"}
    height={height || "24"}
    viewBox={viewBox || "0 0 24 24"}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);
