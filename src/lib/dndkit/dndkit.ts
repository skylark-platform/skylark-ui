import * as dndkit from "@dnd-kit/core";
import { Column } from "@tanstack/react-table";
import { MutableRefObject, ReactNode } from "react";

import { ParsedSkylarkObject } from "src/interfaces/skylark";

declare type AnyData = Record<string, unknown>;

export enum DragType {
  CONTENT_LIBRARY_OBJECT = "CONTENT_LIBRARY_OBJECT",
  OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS = "OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS",
  OBJECT_SEARCH_REORDER_COLUMNS = "OBJECT_SEARCH_REORDER_COLUMNS",
}

type DragOptions = {
  dragOverlay?: ReactNode;
  modifiers?: dndkit.Modifiers;
};

type Data<T> = dndkit.Data<T> & {
  options?: DragOptions;
} & (
    | {
        type: DragType.CONTENT_LIBRARY_OBJECT;
        object: ParsedSkylarkObject;
      }
    | {
        type: DragType.OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS;
        columnId: string;
      }
    | {
        type: DragType.OBJECT_SEARCH_REORDER_COLUMNS;
        column: Column<ParsedSkylarkObject, string>;
      }
  );

interface DataRef<T> extends dndkit.DataRef<T> {
  current: Data<T>;
}

export interface Active<T = AnyData> extends dndkit.Active {
  id: dndkit.UniqueIdentifier;
  data: DataRef<T>;
  rect: MutableRefObject<{
    initial: ClientRect | null;
    translated: ClientRect | null;
  }>;
}

interface DragEvent<T> {
  activatorEvent: Event;
  active: Active<T>;
  collisions: dndkit.Collision[] | null;
  delta: dndkit.Translate;
  over: dndkit.Over | null;
}

export type DragStartEvent<T = AnyData> = Pick<DragEvent<T>, "active">;
export type DragMoveEvent<T = AnyData> = DragEvent<T>;
export type DragOverEvent<T = AnyData> = DragMoveEvent<T>;
export type DragEndEvent<T = AnyData> = DragEvent<T>;
export type DragCancelEvent<T = AnyData> = DragEndEvent<T>;

export interface UseDraggableArguments extends dndkit.UseDraggableArguments {
  type: DragType;
  options?: DragOptions;
}

export interface UseDroppableArguments extends dndkit.UseDroppableArguments {
  type: DragType;
}

export interface DndMonitorListener extends dndkit.DndMonitorListener {
  onDragStart?(event: DragStartEvent): void;
  onDragMove?(event: DragMoveEvent): void;
  onDragOver?(event: DragOverEvent): void;
  onDragEnd?(event: DragEndEvent): void;
  onDragCancel?(event: DragCancelEvent): void;
}

export const useDraggable = ({
  type,
  options,
  ...args
}: UseDraggableArguments) => {
  return dndkit.useDraggable({
    ...args,
    data: {
      ...args.data,
      type,
      options,
    },
  });
};

export const useDroppable = ({ type, ...args }: UseDroppableArguments) => {
  return dndkit.useDroppable({
    ...args,
    data: {
      ...args.data,
      type,
    },
  });
};

export const useDndMonitor = (listener: DndMonitorListener) =>
  dndkit.useDndMonitor(listener);
