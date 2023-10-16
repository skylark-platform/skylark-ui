import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  tooltip: ReactNode;
}

export const Tooltip = ({ children, tooltip }: TooltipProps) => {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          sideOffset={4}
          className={clsx(
            "radix-side-top:animate-slide-down-fade",
            "radix-side-right:animate-slide-left-fade",
            "radix-side-bottom:animate-slide-up-fade",
            "radix-side-left:animate-slide-right-fade",
            "inline-flex items-center rounded-md px-4 py-2.5 md:mx-1",
            "relative z-50 bg-manatee-800 text-xs text-white",
          )}
        >
          <TooltipPrimitive.Arrow className="fill-current text-black" />
          {tooltip}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
