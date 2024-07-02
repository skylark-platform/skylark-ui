import * as AvatarPrimitive from "@radix-ui/react-avatar";
import clsx from "clsx";

interface Props {
  name: string;
  src: string;
  small?: boolean;
  fallbackClassName?: string;
}

export const UserAvatar = ({ name, src, small, fallbackClassName }: Props) => (
  <AvatarPrimitive.Root
    className={clsx(
      `relative inline-flex`,
      small ? "h-6 w-6" : "h-9 w-9 md:h-8 md:w-8",
    )}
  >
    <AvatarPrimitive.Image
      src={src}
      alt={`${name} avatar`}
      className="h-full w-full rounded-full object-cover"
    />
    <AvatarPrimitive.Fallback
      className={clsx(
        "flex h-full w-full items-center justify-center rounded-full",
        fallbackClassName || "bg-brand-primary",
      )}
      // Delay to allow image to load first, unless src not given
      delayMs={src ? 400 : 0}
    >
      <span
        className={clsx(
          "font-medium uppercase text-white",
          small ? "text-xs" : "text-base md:text-sm",
        )}
        data-testid="avatar-fallback"
      >
        {name[0]}
      </span>
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
);
