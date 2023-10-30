import {
  useFloating,
  offset,
  flip,
  autoUpdate,
  useTransitionStyles,
  shift,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

import { TextInput } from "src/components/inputs/textInput";

interface ColourPickerProps {
  colour: string;
  onChange: (c: string) => void;
}

export const ColourPicker = ({ colour, onChange }: ColourPickerProps) => {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    placement: "bottom",
    middleware: [offset(5), flip(), shift({ padding: 5 })],
    whileElementsMounted: autoUpdate,
    onOpenChange: setOpen,
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 75,
    initial: {
      opacity: 0,
      transform: "scale(0.95)",
    },
  });

  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        ref={refs.setReference}
        className="bg-manatee-300 h-6 w-6 rounded border border-manatee-100"
        style={{ backgroundColor: colour }}
        {...getReferenceProps()}
      />
      {isMounted && (
        <div
          className="z-50"
          ref={refs.setFloating}
          style={{ ...floatingStyles }}
          {...getFloatingProps()}
        >
          <div
            className="border rounded-lg z-50 w-full p-4 bg-white space-y-2 drop-shadow"
            style={{ ...transitionStyles }}
          >
            <HexColorPicker color={colour} onChange={onChange} />
            <TextInput
              placeholder="#"
              value={colour}
              onChange={onChange}
              withCopy
              className="w-[200px]"
            />
          </div>
        </div>
      )}
    </>
  );
};
