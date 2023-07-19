import clsx from "clsx";
import { CSSProperties } from "react";

interface SkeletonProps {
  className: string;
  style?: CSSProperties;
}

export const Skeleton = ({ className, style }: SkeletonProps) => (
  <span
    className={clsx("block animate-pulse rounded bg-manatee-200", className)}
    style={style}
  />
);
