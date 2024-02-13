import { useCallback } from "react";

import { ParsedSkylarkObject } from "src/interfaces/skylark";
import {
  DragEndEvent,
  DragType,
  DroppableType,
  useDndMonitor,
} from "src/lib/dndkit/dndkit";

export const usePanelDropzone = (
  droppableType: DroppableType,
  {
    onObjectsDropped,
  }: { onObjectsDropped: (o: ParsedSkylarkObject[]) => void },
) => {
  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, collisions } = event;

      const overContainer =
        over?.data.current?.sortable?.containerId || over?.id;
      const withinDropZone = Boolean(
        collisions?.find(({ id }) => id === droppableType) ||
          overContainer === droppableType,
      );

      if (
        over &&
        withinDropZone &&
        active.data.current.type === DragType.CONTENT_LIBRARY_OBJECT
      ) {
        const draggedObject = active.data.current.object;
        const checkedObjects = active.data.current.checkedObjectsState
          .filter(({ checkedState }) => Boolean(checkedState))
          .map(({ object }) => object);

        const draggedObjectIsChecked = checkedObjects.find(
          ({ uid }) => uid === active.data.current.object.uid,
        );

        const objectsToAdd: ParsedSkylarkObject[] = draggedObjectIsChecked
          ? checkedObjects
          : [draggedObject];

        return onObjectsDropped(objectsToAdd);
      }

      return null;
    },
    [droppableType, onObjectsDropped],
  );

  useDndMonitor({
    onDragEnd,
  });
};
