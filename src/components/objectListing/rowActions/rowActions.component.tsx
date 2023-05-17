import {
  InfoCircle,
  Edit,
  CheckSquare,
  CrossSquare,
  Trash,
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
  <div className="hidden h-full w-full items-center justify-center space-x-2 bg-inherit pl-4 pr-3 text-center group-hover/row:flex">
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
        <button
          onClick={() => console.log("onDeleteClick")}
          aria-label="object-delete"
        >
          <Trash className="h-5 text-error transition-colors hover:text-error/60" />
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
