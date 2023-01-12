import {
  InfoCircle,
  Edit,
  CheckSquare,
  CrossSquare,
} from "src/components/icons";

interface RowActionsProps {
  editRowEnabled?: boolean;
  inEditMode?: boolean;
  onInfoClick: () => void;
  onEditClick: () => void;
  onEditSaveClick: () => void;
  onEditCancelClick: () => void;
}

export const RowActions = ({
  editRowEnabled,
  inEditMode,
  onInfoClick,
  onEditClick,
  onEditSaveClick,
  onEditCancelClick,
}: RowActionsProps) => (
  <div className="flex w-full items-center justify-center gap-3 pl-4 pr-3 text-center">
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
        <button onClick={onInfoClick} aria-label="object-info">
          <InfoCircle className="h-5 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
        </button>
        {editRowEnabled && (
          <button onClick={onEditClick} aria-label="object-edit">
            <Edit className="h-5 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
          </button>
        )}
      </>
    )}
  </div>
);
