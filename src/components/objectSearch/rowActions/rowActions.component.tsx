import { Row } from "@tanstack/react-table";
import Link from "next/link";
import { FiExternalLink, FiInfo } from "react-icons/fi";
import { VirtualItem } from "react-virtual";

import { ParsedSkylarkObject } from "src/interfaces/skylark";

interface RowActionsProps {
  activeRowIndex: number;
  rows: Row<ParsedSkylarkObject>[];
  virtualRows: VirtualItem[];
  onInfoClick?: (object: ParsedSkylarkObject) => void;
}

export const RowActions = ({
  activeRowIndex,
  rows,
  virtualRows,
  onInfoClick,
}: RowActionsProps) => {
  const activeRow = rows.find(({ index }) => index === activeRowIndex);
  const activeVirtualRow = activeRow
    ? virtualRows.find((virtualRow) => virtualRow.index === activeRow.index)
    : null;

  if (!activeRow || !activeVirtualRow) {
    return <></>;
  }

  const object = activeRow.original;

  const transform = `translateY(${activeVirtualRow.start}px)`;

  return (
    <div
      style={{
        height: activeVirtualRow.size,
        transform,
      }}
      className="absolute right-0 z-[3] hidden items-center justify-center space-x-2 bg-manatee-50 text-center sm:flex sm:px-1 md:px-2"
    >
      {onInfoClick && (
        <button
          onClick={() => {
            onInfoClick(object);
          }}
          aria-label="object-info"
        >
          <FiInfo className="stroke-brand-primary text-base transition-colors hover:stroke-brand-primary/60" />
        </button>
      )}
      <Link
        href={{
          pathname: `/object/${object.objectType}/${object.uid}`,
          query: { language: object.meta.language },
        }}
        onClick={(e) => e.stopPropagation()}
        rel="noopener noreferrer"
        target="_blank"
      >
        <FiExternalLink className="text-base transition-colors hover:text-brand-primary" />
      </Link>
    </div>
  );
};
