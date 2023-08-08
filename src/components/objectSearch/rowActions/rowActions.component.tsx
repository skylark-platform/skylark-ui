import { Row } from "@tanstack/react-table";
import Link from "next/link";
import { VirtualItem } from "react-virtual";

import { InfoCircle, ExternalLink } from "src/components/icons";
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
      className="absolute right-0 z-[3] hidden items-center justify-center space-x-0.5 bg-manatee-50 text-center sm:flex sm:px-0.5 md:px-1"
    >
      {onInfoClick && (
        <button onClick={() => onInfoClick(object)} aria-label="object-info">
          <InfoCircle className="h-4 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
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
        <ExternalLink className="h-4 transition-colors hover:text-brand-primary" />
      </Link>
    </div>
  );
};
