import Link from "next/link";

import {
  InfoCircle,
  Edit,
  CheckSquare,
  CrossSquare,
  ExternalLink,
} from "src/components/icons";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";

interface RowActionsProps {
  object: ParsedSkylarkObject;
  editRowEnabled?: boolean;
  inEditMode?: boolean;
  onInfoClick?: () => void;
  onEditClick: () => void;
  onEditSaveClick: () => void;
  onEditCancelClick: () => void;
}

export const RowActions = ({
  object,
  editRowEnabled,
  inEditMode,
  onInfoClick,
  onEditClick,
  onEditSaveClick,
  onEditCancelClick,
}: RowActionsProps) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { config } = objectTypesWithConfig?.find(
    ({ objectType }) => objectType === object.objectType,
  ) || { config: object.config };

  return (
    <div className="group/row-action relative h-full">
      <div
        className="absolute bottom-1.5 left-3 top-1.5 w-1 bg-manatee-300 group-hover/row-action:hidden"
        style={{ background: config.colour }}
      ></div>
      <div className="flex h-full w-full items-center justify-center bg-inherit pl-1 text-center opacity-0 group-hover/row:flex group-hover/row-action:opacity-100">
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
                pathname: `/object/${object.objectType}/${object.uid}`,
                query: { language: object.meta.language },
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
    </div>
  );
};
