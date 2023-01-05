import clsx from "clsx";
import Link from "next/link";
import { ReactNode } from "react";
import { CgSpinner } from "react-icons/cg";

export interface ButtonProps {
  onClick?: () => void;
  children: ReactNode;
  variant: "primary" | "outline" | "ghost";
  loading?: boolean;
  success?: boolean;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  block?: boolean;
  Icon?: JSX.Element;
  href?: string;
}

export const Button = ({
  onClick,
  children,
  variant = "primary",
  loading,
  success,
  danger,
  disabled,
  className,
  block,
  Icon,
  href,
}: ButtonProps) => {
  const combinedClassName = clsx(
    "min-h-8 btn h-8 rounded-full text-xs normal-case md:h-10 md:text-sm min-w-24",
    variant === "primary" && "btn-primary shadow",
    variant === "outline" &&
      "btn-outline btn-primary disabled:border-none disabled:shadow",
    variant === "ghost" && "btn-ghost text-brand-primary hover:bg-transparent",
    success && "btn-success text-white",
    danger && "btn-error",
    (disabled || loading) && "bg-disabled btn-disabled",
    block && "btn-block",
    className,
  );

  if (href) {
    return (
      <Link legacyBehavior href={href}>
        <a className={combinedClassName}>{children}</a>
      </Link>
    );
  }
  return (
    <button className={combinedClassName} disabled={disabled} onClick={onClick}>
      {loading && (
        <CgSpinner className="mr-1 animate-spin-fast text-base md:text-lg" />
      )}
      {!loading && Icon && <div className="mr-1">{Icon}</div>}
      {children}
    </button>
  );
};
