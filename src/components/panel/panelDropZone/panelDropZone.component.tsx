import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

import { DroppableType } from "src/lib/dndkit/dndkit";

export const PanelDropZone = () => {
  const { isOver, setNodeRef } = useDroppable({
    id: DroppableType.PANEL_GENERIC,
  });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        isOver && "border-primary text-primary",
        "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-base text-manatee-400",
      )}
      data-cy="panel-drop-zone"
    >
      <span>{`Drop here`}</span>
    </div>
  );
};
