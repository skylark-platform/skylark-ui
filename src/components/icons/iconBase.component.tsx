import { ReactNode } from "react";

export interface IconProps {
  className?: string;
}

export const IconBase = ({
  className,
  children,
}: IconProps & { children: ReactNode }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);
