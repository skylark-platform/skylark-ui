import { Row } from "@tanstack/react-table";
import Link from "next/link";
import { VirtualItem } from "react-virtual";

import { InfoCircle, ExternalLink } from "src/components/icons";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
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
  console.log({ activeRow, activeVirtualRow });

  if (!activeRow || !activeVirtualRow) {
    return <></>;
  }

  const object = activeRow.original;

  return (
    <div
      style={{
        height: activeVirtualRow.size,
        transform: `translateY(${activeVirtualRow.start - 1}px)`,
      }}
      className="fixed right-0 z-10 hidden items-center justify-center space-x-2 bg-white text-center sm:flex sm:w-20 md:w-24"
    >
      {onInfoClick && (
        <button onClick={() => onInfoClick(object)} aria-label="object-info">
          <InfoCircle className="h-5 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
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
        <ExternalLink className="h-5 transition-colors hover:text-brand-primary" />
      </Link>
    </div>
  );
};
