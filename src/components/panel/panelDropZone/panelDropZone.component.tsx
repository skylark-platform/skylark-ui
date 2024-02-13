import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useCallback, useState } from "react";

import {
  DragOverEvent,
  DroppableType,
  useDndMonitor,
} from "src/lib/dndkit/dndkit";

export const PanelDropZone = () => {
  const { setNodeRef } = useDroppable({
    id: DroppableType.PANEL_GENERIC,
  });

  // Due to the collision used in the Content Library Row (for sorting on the Content tab),
  // we need to manually check isOver as the collision can be with multiple elements
  const [isOver, setIsOver] = useState(false);

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, collisions } = event;

      const overContainer =
        over?.data.current?.sortable?.containerId || over?.id;
      const withinDropZone = Boolean(
        collisions?.find(({ id }) => id === DroppableType.PANEL_GENERIC) ||
          overContainer === DroppableType.PANEL_GENERIC,
      );

      if (isOver !== withinDropZone) {
        setIsOver(withinDropZone);
      }
    },
    [isOver],
  );

  useDndMonitor({ onDragOver });

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
