import clsx from "clsx";

interface SkeletonProps {
  className: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <span
    className={clsx("block animate-pulse rounded bg-manatee-200", className)}
  />
);
