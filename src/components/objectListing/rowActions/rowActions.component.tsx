import {
  InfoCircle,
  Edit,
  CheckSquare,
  CrossSquare,
} from "src/components/icons";

interface RowActionsProps {
  inEditMode?: boolean;
  onInfoClick: () => void;
  onEditClick: () => void;
  onEditSaveClick: () => void;
  onEditCancelClick: () => void;
}

export const RowActions = ({
  inEditMode,
  onInfoClick,
  onEditClick,
  onEditSaveClick,
  onEditCancelClick,
}: RowActionsProps) => (
  <div className="flex w-full items-center justify-center gap-3 pl-4 text-center ">
    {inEditMode ? (
      <>
        <button onClick={onEditSaveClick}>
          <CheckSquare className="h-5 stroke-success transition-colors hover:stroke-success/60" />
        </button>
        <button onClick={onEditCancelClick}>
          <CrossSquare className="h-5 stroke-error transition-colors hover:stroke-error/60" />
        </button>
      </>
    ) : (
      <>
        <button onClick={onInfoClick}>
          <InfoCircle className="h-5 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
        </button>
        <button onClick={onEditClick}>
          <Edit className="h-5 stroke-brand-primary transition-colors hover:stroke-brand-primary/60" />
        </button>
      </>
    )}
  </div>
);
