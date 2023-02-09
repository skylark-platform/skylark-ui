import clsx from "clsx";
import Link from "next/link";
import { ReactNode } from "react";
import { CgSpinner } from "react-icons/cg";

export interface ButtonProps {
  onClick?: () => void;
  children?: ReactNode;
  variant: "primary" | "outline" | "ghost";
  loading?: boolean;
  success?: boolean;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  block?: boolean;
  Icon?: JSX.Element;
  href?: string;
  type?: "button" | "submit" | "reset";
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
  type,
}: ButtonProps) => {
  const iconOnly = Icon && !children;

  const combinedClassName = clsx(
    "btn flex-nowrap",
    Icon && children && "gap-2",
    !iconOnly && "min-h-8 text-xs normal-case h-8 md:h-10 md:text-sm",
    variant !== "ghost" && "min-w-24 rounded-full",
    variant === "primary" && "btn-primary shadow",
    variant === "outline" &&
      "btn-outline btn-primary disabled:border-none disabled:shadow",
    variant === "ghost" && "btn-ghost text-back hover:bg-transparent p-0",
    success && "btn-success text-white",
    danger && "btn-error",
    !iconOnly && (disabled || loading) && "bg-disabled btn-disabled",
    iconOnly && disabled && "btn-disabled disabled:bg-transparent",
    block && "btn-block",
    className,
  );

  if (href) {
    return (
      <Link legacyBehavior href={href}>
        <a className={combinedClassName}>
          {Icon}
          {children}
        </a>
      </Link>
    );
  }
  return (
    <button
      className={combinedClassName}
      disabled={disabled}
      onClick={onClick}
      type={type || "button"}
    >
      {loading && (
        <CgSpinner className="mr-1 animate-spin-fast text-base md:text-lg" />
      )}
      {!loading && Icon}
      {children}
    </button>
  );
};
