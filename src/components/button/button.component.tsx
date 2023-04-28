import clsx from "clsx";
import Link from "next/link";
import { forwardRef, ReactNode, Ref } from "react";
import { CgSpinner } from "react-icons/cg";

export interface ButtonProps {
  onClick?: () => void;
  children?: ReactNode;
  variant: "primary" | "outline" | "ghost" | "link";
  loading?: boolean;
  success?: boolean;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  block?: boolean;
  Icon?: JSX.Element;
  href?: string;
  downloadName?: string;
  type?: "button" | "submit" | "reset";
  newTab?: boolean;
}

export const Button = forwardRef(
  (
    {
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
      downloadName,
      type,
      newTab,
      ...props
    }: ButtonProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    const iconOnly = Icon && !children;

    const combinedClassName = clsx(
      "btn flex-nowrap",
      Icon && children && "gap-x-2",
      !iconOnly && "min-h-8 text-xs normal-case h-8 md:h-10 md:text-sm",
      variant !== "ghost" && "min-w-24 rounded-full",
      variant === "primary" && "btn-primary shadow",
      variant === "outline" &&
        "btn-outline btn-primary disabled:border-none disabled:shadow",
      variant === "ghost" && "btn-ghost text-black hover:bg-transparent p-0",
      variant === "link" && "btn-link",
      success && !disabled && !loading && "btn-success text-white",
      danger && "btn-error",
      !iconOnly &&
        variant !== "link" &&
        (disabled || loading) &&
        "bg-disabled btn-disabled",
      (iconOnly || variant === "link") &&
        disabled &&
        "btn-disabled bg-transparent disabled:bg-transparent",
      block && "btn-block",
      className,
    );

    if (href) {
      return (
        <Link legacyBehavior href={href}>
          <a
            className={combinedClassName}
            download={downloadName}
            target={newTab ? "_blank" : undefined}
            {...props}
          >
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
        ref={ref}
        {...props}
      >
        {loading && (
          <CgSpinner className="mr-1 animate-spin-fast text-base md:text-lg" />
        )}
        {!loading && Icon}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
