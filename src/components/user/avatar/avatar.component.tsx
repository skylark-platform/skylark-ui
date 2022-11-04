import * as AvatarPrimitive from "@radix-ui/react-avatar";

interface Props {
  name: string;
  src: string;
}

export const UserAvatar = ({ name, src }: Props) => (
  <AvatarPrimitive.Root className={`relative inline-flex h-8 w-8`}>
    <AvatarPrimitive.Image
      src={src}
      alt={`${name} avatar`}
      className="h-full w-full object-cover rounded-full"
    />
    <AvatarPrimitive.Fallback
      className="flex h-full w-full items-center justify-center bg-brand-primary rounded-full"
      // Delay to allow image to load first
      delayMs={300}
    >
      <span className="text-sm font-medium uppercase text-white">
        {name[0]}
      </span>
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
);
