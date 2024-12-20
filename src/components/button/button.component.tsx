import clsx from "clsx";
import Link from "next/link";
import { forwardRef, JSX, ReactNode, Ref } from "react";
import { CgSpinner } from "react-icons/cg";

export interface ButtonProps {
  onClick?: () => void;
  children?: ReactNode;
  variant:
    | "primary"
    | "neutral"
    | "outline"
    | "ghost"
    | "link"
    | "form"
    | "form-ghost";
  loading?: boolean;
  success?: boolean;
  danger?: boolean;
  warning?: boolean;
  disabled?: boolean;
  className?: string;
  block?: boolean;
  Icon?: JSX.Element;
  href?: string;
  downloadName?: string;
  type?: "button" | "submit" | "reset";
  newTab?: boolean;
  animated?: boolean;
  "aria-label"?: string;
  slot?: string;
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
      warning,
      disabled,
      className,
      block,
      Icon,
      href,
      downloadName,
      type,
      newTab,
      animated = true,
      ...props
    }: ButtonProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    const iconOnly = Icon && !children;

    const combinedClassName = clsx(
      "btn flex-nowrap",
      Boolean(Icon && children) && "gap-x-2",
      !iconOnly && "text-xs normal-case md:text-sm",
      !iconOnly && variant !== "form" && "min-h-8 h-8 md:h-10",
      variant === "primary" && "btn-primary shadow",
      variant === "neutral" &&
        "btn-neutral bg-manatee-50 hover:bg-manatee-100 border-none",
      variant === "outline" &&
        "btn-outline btn-primary disabled:border-none disabled:shadow",
      variant === "ghost" &&
        "btn-ghost text-black hover:bg-transparent p-0 disabled:bg-transparent bg-transparent min-h-8 h-8",
      variant === "link" && "btn-link",
      (variant === "form" || variant === "form-ghost") &&
        "p-0 h-auto min-h-0 btn-ghost hover:bg-transparent hover:text-brand-primary",
      variant === "form-ghost" &&
        "opacity-30 transition-opacity hover:opacity-100 active:opacity-60",
      success && !disabled && !loading && "btn-success text-white",
      danger && "btn-error",
      warning && "btn-warning",
      !iconOnly &&
        variant !== "link" &&
        (disabled || loading) &&
        "bg-disabled btn-disabled",
      variant !== "ghost" && variant !== "form" && "rounded-full",
      variant !== "ghost" &&
        variant !== "form" &&
        !iconOnly &&
        "min-w-16 sm:min-w-20 md:min-w-24",
      (iconOnly || variant === "link") &&
        disabled &&
        "btn-disabled bg-transparent disabled:bg-transparent",
      !iconOnly && variant !== "ghost" ? "px-2 md:px-5" : "",
      block && "btn-block",
      !animated && "no-animation",
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
