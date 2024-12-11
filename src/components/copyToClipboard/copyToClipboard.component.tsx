import clsx from "clsx";
import { JSX } from "react";
import { FiCopy } from "react-icons/fi";

interface CopyToClipboardProps {
  value?: string | number | true | JSX.Element | string[];
  className?: string;
}

export const CopyToClipboard = ({ value, className }: CopyToClipboardProps) =>
  value ? (
    <FiCopy
      aria-label={`Copy ${value} to clipboard`}
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard.writeText(`${value}`);
      }}
      className={clsx(
        "ml-2 cursor-pointer inline text-base opacity-20 transition-opacity hover:opacity-100 active:opacity-60 group-hover/copy-to-clipboard:visible",
        className,
      )}
    />
  ) : (
    <></>
  );
