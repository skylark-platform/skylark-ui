import { closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { useState, useRef, useCallback } from "react";
import { useVirtual } from "react-virtual";

import { ContentObjectIdenfierCard } from "src/components/objectIdentifier/card/contentObjectIdentifierCard.component";
import { ObjectIdentifierCard } from "src/components/objectIdentifier/card/objectIdentifierCard.component";
import {
  HandleDropError,
  handleDroppedContents,
} from "src/components/panel/panel.lib";
import { PanelSeparator } from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { SetPanelObject } from "src/hooks/state";
import {
  SkylarkObjectContentObject,
  AddedSkylarkObjectContentObject,
  SkylarkObject,
} from "src/interfaces/skylark";
import {
  DragType,
  generateSortableObjectId,
  DroppableType,
  useSortable,
  DragEndEvent,
  DragOverEvent,
  useDndMonitor,
} from "src/lib/dndkit/dndkit";
import { hasProperty, insertAtIndex } from "src/lib/utils";

const DISPLAY_OBJ_ID = "display-object";

interface ContentObjectProps {
  sortableId: string;
  object: AddedSkylarkObjectContentObject;
  inEditMode?: boolean;
  arrIndex: number;
  arrLength: number;
  disableReorder?: boolean;
  setPanelObject: SetPanelObject;
  removeItem: (uid: string) => void;
  handleManualOrderChange: (
    currentIndex: number,
    updatedPosition: number,
  ) => void;
}

interface SortableDisplayObject {
  id: typeof DISPLAY_OBJ_ID;
}

type SortableObject = (
  | SkylarkObjectContentObject
  | AddedSkylarkObjectContentObject
) & {
  id: string;
};

interface SortableContentObjectListProps {
  uid: string;
  objects: SkylarkObjectContentObject[];
  onReorder: (
    updated: AddedSkylarkObjectContentObject[],
    errors?: HandleDropError[],
  ) => void;
  setPanelObject: SetPanelObject;
  isLoading: boolean;
  isDragging: boolean;
  inEditMode?: boolean;
  disableReorder?: boolean;
  disableVirtualization?: boolean;
}

const isSortableDisplayObject = (
  obj: SortableObject | SortableDisplayObject,
): obj is SortableDisplayObject => obj.id === DISPLAY_OBJ_ID;

const SortableSkylarkContentObjectCard = ({
  sortableId,
  object,
  inEditMode,
  arrIndex,
  arrLength,
  disableReorder,
  removeItem,
  setPanelObject,
  handleManualOrderChange,
}: ContentObjectProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled: disableReorder || !inEditMode,
    type: DragType.PANEL_CONTENT_REORDER_OBJECTS,
    options: {
      modifiers: [],
      dragOverlay: (
        <ObjectIdentifierCard
          className="bg-white px-2 shadow-md cursor-grabbing"
          object={object}
        />
      ),
      collisionDetection: closestCenter,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const onPositionChange = useCallback(
    (newPosition: number) => {
      handleManualOrderChange(arrIndex, newPosition);
    },
    [arrIndex, handleManualOrderChange],
  );

  const onDeleteClick = useCallback(() => {
    removeItem(object.uid);
  }, [object.uid, removeItem]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(object.isDynamic || disableReorder ? {} : listeners)}
      data-testid={`panel-object-content-item-${arrIndex + 1}`}
      data-cy={"panel-object-content-item"}
    >
      <ContentObjectIdenfierCard
        object={object}
        onPositionChange={onPositionChange}
        onForwardClick={setPanelObject}
        disableForwardClick={inEditMode}
        disableDeleteClick={!inEditMode}
        canEditPosition={!disableReorder && inEditMode}
        showDragIcon={!disableReorder && inEditMode}
        isNewObject={object.isNewObject}
        onDeleteClick={onDeleteClick}
        actualPosition={arrIndex + 1}
        maxPosition={arrLength}
      />
      {arrIndex < arrLength - 1 && <PanelSeparator transparent={inEditMode} />}
    </div>
  );
};

const SortableContentObjectListItem = ({
  object,
  virtualizedOptions,
  isLastItem,
  ...props
}: {
  object: SortableObject | SortableDisplayObject;
  virtualizedOptions?: {
    height: string;
    transform: string;
  };
  isLastItem: boolean;
} & Omit<ContentObjectProps, "object">) => {
  if (isSortableDisplayObject(object)) {
    return (
      <>
        <div
          className={clsx(
            "h-10 bg-manatee-100 flex items-center justify-end w-full",
            virtualizedOptions && "top-0 left-0 absolute",
          )}
          key={object.id}
          style={virtualizedOptions}
        >
          {!isLastItem && <PanelSeparator transparent={props.inEditMode} />}
        </div>
      </>
    );
  }
  return (
    <div
      key={object.id}
      className="top-0 left-0 w-full absolute"
      style={virtualizedOptions}
    >
      <SortableSkylarkContentObjectCard
        key={object.id}
        object={object}
        {...props}
      />
    </div>
  );
};

export const SortableContentObjectList = ({
  uid,
  objects,
  onReorder,
  setPanelObject,
  isLoading,
  isDragging,
  inEditMode,
  disableReorder,
  disableVirtualization,
}: SortableContentObjectListProps) => {
  const [overRowIndex, setOverRowIndex] = useState<number | null>(null);

  const preppedObjects: SortableObject[] | undefined = objects.map(
    (object) => ({
      ...object,
      id: generateSortableObjectId(object, "PANEL_CONTENT"),
    }),
  );

  const sortableObjects: (SortableObject | SortableDisplayObject)[] =
    overRowIndex !== null && preppedObjects
      ? insertAtIndex<SortableObject | SortableDisplayObject>(
          preppedObjects,
          overRowIndex,
          {
            id: DISPLAY_OBJ_ID,
          },
        )
      : preppedObjects || [];

  const handleDragOver = (event: DragOverEvent) => {
    const { over, collisions } = event;

    if (
      event.active.data.current.type === DragType.CONTENT_LIBRARY_OBJECT &&
      over &&
      objects
    ) {
      // Use first collision id as over id could be from the content library search
      const collisionIds = collisions
        ?.map((collision) => collision.id)
        .filter((id) => !String(id).startsWith("content-library-search")); // TODO don't use a string
      const overId = collisionIds?.[0] || over.id;

      // DragOver handler for when the item has already been dragged over the sortable list and is now reordering
      if (
        over?.data?.current?.type === DragType.PANEL_CONTENT_REORDER_OBJECTS
      ) {
        const overIndex = over?.data?.current?.sortable.index;
        setOverRowIndex(
          typeof overIndex === "number" && overIndex > -1 ? overIndex : null,
        );
        return;
      }

      // DragOver handler for when the item is dragged over the content dropzone but isn't over the sortable list
      if (
        overId === DroppableType.PANEL_CONTENT_SORTABLE &&
        (overRowIndex === null || !over?.data?.current?.sortable)
      ) {
        setOverRowIndex(objects.length);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, collisions } = event;

    const overContainer = over?.data.current?.sortable?.containerId || over?.id;
    const withinDropZone = Boolean(
      collisions?.find(
        ({ id }) => id === DroppableType.PANEL_CONTENT_SORTABLE,
      ) || overContainer === DroppableType.PANEL_CONTENT_SORTABLE,
    );

    if (
      objects &&
      sortableObjects &&
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

      const objectsToAdd: SkylarkObject[] = draggedObjectIsChecked
        ? checkedObjects
        : [draggedObject];

      const { updatedContentObjects, errors } = handleDroppedContents({
        droppedObjects: objectsToAdd,
        activeObjectUid: uid,
        existingObjects: objects,
        indexToInsert: overRowIndex !== null ? overRowIndex : -1,
      });

      onReorder(updatedContentObjects, errors);
    }

    if (
      objects &&
      sortableObjects &&
      over &&
      active.data.current.type === DragType.PANEL_CONTENT_REORDER_OBJECTS
    ) {
      const oldIndex = sortableObjects.findIndex(({ id }) => id === active.id);
      const newIndex = sortableObjects.findIndex(({ id }) => id === over.id);

      const updatedObjects =
        oldIndex > -1 && newIndex > -1
          ? arrayMove(objects, oldIndex, newIndex)
          : objects;
      const updatedObjectsWithIdFieldRemoved = updatedObjects.map((obj) => {
        if (hasProperty(obj, "id")) delete obj.id;
        return obj;
      });

      onReorder(updatedObjectsWithIdFieldRemoved);
    }
    setOverRowIndex(null);
  };

  const handleDragCancel = () => {
    setOverRowIndex(null);
  };

  useDndMonitor({
    onDragOver: !disableReorder ? handleDragOver : undefined,
    onDragEnd: !disableReorder ? handleDragEnd : undefined,
    onDragCancel: !disableReorder ? handleDragCancel : undefined,
  });

  const removeItem = (uid: string) => {
    if (objects) {
      const filtered = objects.filter((object) => uid !== object.uid);
      onReorder(filtered);
    }
  };

  const handleManualOrderChange = (
    currentIndex: number,
    updatedPosition: number,
  ) => {
    if (objects) {
      const updatedIndex = updatedPosition - 1;
      const realUpdatedIndex =
        updatedIndex <= 0
          ? 0
          : updatedIndex >= objects.length
            ? objects.length - 1
            : updatedIndex;
      const updatedObjects = [...objects];

      const objToMove = updatedObjects.splice(currentIndex, 1)[0];
      updatedObjects.splice(realUpdatedIndex, 0, objToMove);

      onReorder(updatedObjects);
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    parentRef,
    size: sortableObjects.length,
    estimateSize: useCallback(() => 48, []),
    overscan: 0,
  });

  return (
    <SortableContext
      id={DroppableType.PANEL_CONTENT_SORTABLE}
      items={sortableObjects}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={disableVirtualization ? undefined : parentRef}
        data-testid="panel-content-items"
        className={clsx(
          "w-full border border-dashed flex-grow overflow-scroll px-8 h-full",
          isDragging ? "border-brand-primary" : "border-transparent",
        )}
      >
        {!disableVirtualization ? (
          <div
            className="w-full relative"
            style={{
              height: `${rowVirtualizer.totalSize}px`,
            }}
          >
            {rowVirtualizer.virtualItems.map((virtualRow, index) => {
              const object = sortableObjects[virtualRow.index];
              return (
                <SortableContentObjectListItem
                  key={object.id}
                  sortableId={object.id}
                  object={object}
                  virtualizedOptions={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  inEditMode={inEditMode}
                  arrIndex={index}
                  arrLength={sortableObjects.length}
                  removeItem={removeItem}
                  handleManualOrderChange={handleManualOrderChange}
                  setPanelObject={setPanelObject}
                  disableReorder={disableReorder}
                  isLastItem={index < sortableObjects.length - 1}
                />
              );
            })}
          </div>
        ) : (
          <>
            {sortableObjects.map((object, index) => (
              <SortableContentObjectListItem
                key={object.id}
                sortableId={object.id}
                object={object}
                inEditMode={inEditMode}
                arrIndex={index}
                arrLength={sortableObjects.length}
                removeItem={removeItem}
                handleManualOrderChange={handleManualOrderChange}
                setPanelObject={setPanelObject}
                disableReorder={disableReorder}
                isLastItem={index < sortableObjects.length - 1}
              />
            ))}
          </>
        )}
        {isLoading &&
          Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={`content-skeleton-${i}`}
              className="mb-2 h-11 w-full max-w-xl"
            />
          ))}
      </div>
    </SortableContext>
  );
};
