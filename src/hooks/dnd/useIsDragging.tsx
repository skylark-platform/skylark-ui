import { useMemo, useState } from "react";

import {
  Active,
  DragStartEvent,
  DragType,
  useDndMonitor,
} from "src/lib/dndkit/dndkit";

export const useIsDragging = (dragType: DragType | null) => {
  const [activeDragged, setActiveDragged] = useState<Active | null>(null);

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragged(event.active);
  };

  const onDragEnd = () => {
    setActiveDragged(null);
  };

  useDndMonitor({
    onDragStart,
    onDragEnd,
    onDragCancel: onDragEnd,
  });

  const isDragging = useMemo(
    () =>
      Boolean(
        activeDragged &&
          (!dragType || activeDragged.data.current.type === dragType),
      ),
    [activeDragged, dragType],
  );

  return [isDragging];
};
