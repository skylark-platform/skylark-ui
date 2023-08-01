import Link from "next/link";

import {
  InfoCircle,
  Edit,
  CheckSquare,
  CrossSquare,
  ExternalLink,
} from "src/components/icons";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

interface RowActionsProps {
  object: SkylarkObjectIdentifier;
  editRowEnabled?: boolean;
  inEditMode?: boolean;
  onInfoClick?: () => void;
  onEditClick: () => void;
  onEditSaveClick: () => void;
  onEditCancelClick: () => void;
}

export const RowActions = ({
  object: { uid, objectType, language },
  editRowEnabled,
  inEditMode,
  onInfoClick,
  onEditClick,
  onEditSaveClick,
  onEditCancelClick,
}: RowActionsProps) => (
  <div className="flex h-full w-full items-center justify-center space-x-1 bg-inherit pl-4 pr-3 text-center group-hover/row:flex">
    {inEditMode && editRowEnabled ? (
      <>
        <button onClick={onEditSaveClick} aria-label="object-edit-save">
          <CheckSquare className="h-5 stroke-success transition-colors hover:stroke-success/60" />
        </button>
        <button onClick={onEditCancelClick} aria-label="object-edit-cancel">
          <CrossSquare className="h-5 stroke-error transition-colors hover:stroke-error/60" />
        </button>
      </>
    ) : (
      <>
        {onInfoClick && (
          <button onClick={onInfoClick} aria-label="object-info">
            <InfoCircle className="h-4 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
          </button>
        )}
        <Link
          href={{
            pathname: `/object/${objectType}/${uid}`,
            query: { language },
          }}
          onClick={(e) => e.stopPropagation()}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-4 transition-colors hover:text-brand-primary" />
        </Link>
        {editRowEnabled && (
          <button onClick={onEditClick} aria-label="object-edit">
            <Edit className="h-5 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
          </button>
        )}
      </>
    )}
  </div>
);
