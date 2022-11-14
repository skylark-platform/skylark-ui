import * as AvatarPrimitive from "@radix-ui/react-avatar";

interface Props {
  name: string;
  src: string;
}

export const UserAvatar = ({ name, src }: Props) => (
  <AvatarPrimitive.Root
    className={`relative inline-flex h-9 w-9 md:h-8 md:w-8`}
  >
    <AvatarPrimitive.Image
      src={src}
      alt={`${name} avatar`}
      className="h-full w-full rounded-full object-cover"
    />
    <AvatarPrimitive.Fallback
      className="flex h-full w-full items-center justify-center rounded-full bg-brand-primary"
      // Delay to allow image to load first, unless src not given
      delayMs={src ? 400 : 0}
    >
      <span
        className="text-base font-medium uppercase text-white md:text-sm"
        data-testid="avatar-fallback"
      >
        {name[0]}
      </span>
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
);
