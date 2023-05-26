import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

import { DROPPABLE_ID } from "src/constants/skylark";

export const PanelDropZone = () => {
  const { isOver, setNodeRef } = useDroppable({
    id: DROPPABLE_ID,
  });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        isOver && "border-primary text-primary",
        "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-base text-manatee-400",
      )}
    >
      <span>{`Drop here`}</span>
    </div>
  );
};
