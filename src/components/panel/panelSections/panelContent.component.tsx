import {
  closestCenter,
  useDndContext,
  useDndMonitor,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { FiDatabase } from "react-icons/fi";

import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  HandleDropError,
  handleDroppedContents,
} from "src/components/panel/panel.lib";
import { PanelLoading } from "src/components/panel/panelLoading";
import { PanelPositionInput } from "src/components/panel/panelPositionInput/panelPositionInput.component";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { useGetObjectContent } from "src/hooks/objects/get/useGetObjectContent";
import { SetPanelObject } from "src/hooks/state";
import {
  ParsedSkylarkObjectContentObject,
  AddedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import {
  DragEndEvent,
  DragOverEvent,
  DragType,
  DroppableType,
  generateSortableObjectId,
  useSortable,
} from "src/lib/dndkit/dndkit";
import { hasProperty, insertAtIndex } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelContentProps extends SkylarkObjectIdentifier {
  isPage?: boolean;
  objects: AddedSkylarkObjectContentObject[] | null;
  setContentObjects: (
    contentObjects: {
      original: ParsedSkylarkObjectContentObject[] | null;
      updated: AddedSkylarkObjectContentObject[] | null;
    },
    errors: HandleDropError[],
  ) => void;
  inEditMode?: boolean;
  setPanelObject: SetPanelObject;
}

interface SortableContentObject extends AddedSkylarkObjectContentObject {
  id: string;
}

const DISPLAY_OBJ_ID = "display-object";

interface SortableDisplayObject {
  id: typeof DISPLAY_OBJ_ID;
}

const isSortableDisplayObject = (
  obj: SortableContentObject | SortableDisplayObject,
): obj is SortableDisplayObject => obj.id === DISPLAY_OBJ_ID;

interface ContentObjectProps {
  sortableId: string;
  contentObject: ParsedSkylarkObjectContentObject;
  inEditMode?: boolean;
  arrIndex: number;
  arrLength: number;
  setPanelObject: SetPanelObject;
  removeItem: (uid: string) => void;
  handleManualOrderChange: (
    currentIndex: number,
    updatedPosition: number,
  ) => void;
}

const SortableItem = ({
  sortableId,
  contentObject,
  inEditMode,
  arrIndex,
  arrLength,
  removeItem,
  setPanelObject,
  handleManualOrderChange,
}: ContentObjectProps) => {
  const { object, config, meta, position, isDynamic } = contentObject;
  const isNewObject = hasProperty(contentObject, "isNewObject");

  const parsedObject: ParsedSkylarkObject = {
    objectType: object.__typename as string,
    uid: object.uid,
    metadata: object,
    config,
    meta,
    availability: {
      status: meta.availabilityStatus,
      objects: [],
    },
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled: !inEditMode,
    type: DragType.PANEL_CONTENT_REORDER_OBJECTS,
    options: {
      modifiers: [],
      dragOverlay: (
        <ObjectIdentifierCard
          className="bg-white px-2 shadow-md cursor-grabbing"
          object={parsedObject}
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

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(isDynamic ? {} : listeners)}
        data-testid={`panel-object-content-item-${arrIndex + 1}`}
        data-cy={"panel-object-content-item"}
      >
        <ObjectIdentifierCard
          object={parsedObject}
          onForwardClick={setPanelObject}
          disableForwardClick={inEditMode}
          disableDeleteClick={!inEditMode}
          showDragIcon={inEditMode && !isDynamic}
          onDeleteClick={isDynamic ? undefined : () => removeItem(object.uid)}
        >
          {isDynamic ? (
            <Tooltip
              tooltip={"Included in one or more dynamic content rules"}
              side="left"
            >
              <div className="bg-manatee-600 p-1 h-6 w-6 flex justify-center items-center rounded-full">
                <FiDatabase className="text-white" />
              </div>
            </Tooltip>
          ) : (
            <div className="flex">
              {inEditMode && (
                <span
                  className={clsx(
                    "flex h-6 items-center justify-center px-0.5 text-manatee-400 transition-opacity",
                    position === arrIndex + 1 || isNewObject
                      ? "opacity-0"
                      : "opacity-100",
                  )}
                >
                  {position}
                </span>
              )}
              <PanelPositionInput
                disabled={!inEditMode}
                position={arrIndex + 1}
                hasMoved={!!inEditMode && position !== arrIndex + 1}
                isNewObject={inEditMode && isNewObject}
                onBlur={(updatedPosition: number) =>
                  handleManualOrderChange(arrIndex, updatedPosition)
                }
                maxPosition={arrLength}
              />
            </div>
          )}
        </ObjectIdentifierCard>
        {arrIndex < arrLength - 1 && (
          <PanelSeparator transparent={inEditMode} />
        )}
      </li>
    </>
  );
};

export const PanelContent = ({
  isPage,
  objects: updatedObjects,
  inEditMode,
  objectType,
  uid,
  language,
  setContentObjects,
  setPanelObject,
}: PanelContentProps) => {
  const { active: activeDragged } = useDndContext();
  const isDragging = useMemo(() => Boolean(activeDragged), [activeDragged]);

  const [overRowIndex, setOverRowIndex] = useState<number | null>(null);

  const { data, isLoading, hasNextPage, isFetchingNextPage, query, variables } =
    useGetObjectContent(objectType, uid, {
      language,
      fetchAvailability: true,
    });

  const objects = inEditMode ? updatedObjects : data;

  useEffect(() => {
    if (!inEditMode && data) {
      setContentObjects(
        {
          original: data,
          updated: data,
        },
        [],
      );
    }
  }, [data, inEditMode, setContentObjects]);

  const onReorder = (
    updated: AddedSkylarkObjectContentObject[],
    errors?: HandleDropError[],
  ) =>
    setContentObjects(
      {
        original: data || null,
        updated,
      },
      errors || [],
    );

  const removeItem = (uid: string) => {
    if (objects) {
      const filtered = objects.filter(({ object }) => uid !== object.uid);
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

  const preppedObjects: SortableContentObject[] | undefined = objects?.map(
    (object) => ({
      ...object,
      id: generateSortableObjectId(
        {
          uid: object.object.uid,
          objectType: object.object.__typename as string,
          meta: { language: object.meta.language },
        },
        "PANEL_CONTENT",
      ),
    }),
  );

  const sortableObjects: (SortableContentObject | SortableDisplayObject)[] =
    overRowIndex !== null && preppedObjects
      ? insertAtIndex<SortableContentObject | SortableDisplayObject>(
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

      const objectsToAdd: ParsedSkylarkObject[] = draggedObjectIsChecked
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
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  });

  const { setNodeRef } = useDroppable({
    id: DroppableType.PANEL_CONTENT_SORTABLE,
  });

  return (
    <PanelSectionLayout
      sections={[
        { htmlId: "content-panel-title", title: "Content", id: "content" },
      ]}
      isPage={isPage}
      ref={setNodeRef}
    >
      <PanelSectionTitle
        text="Content"
        id="content-panel-title"
        count={objects?.length || 0}
        loading={isLoading || isFetchingNextPage}
      />
      <SortableContext
        id={DroppableType.PANEL_CONTENT_SORTABLE}
        items={sortableObjects}
        strategy={verticalListSortingStrategy}
      >
        <ul
          data-testid="panel-content-items"
          className={clsx(
            "w-full border border-dashed flex-grow h-full",
            isLoading && objects?.length === 0 && "hidden",
            isDragging && objects && objects.length < 8
              ? "border-brand-primary"
              : "border-transparent",
          )}
        >
          {!isLoading &&
            objects?.length === 0 &&
            ((inEditMode && !isPage) || isDragging ? (
              <p className="w-full text-left text-sm text-manatee-600 p-0.5">
                {
                  "Drag & Drop an object from the Content Library here to add as content."
                }
              </p>
            ) : (
              <PanelEmptyDataText />
            ))}
          {sortableObjects.map((contentObject, index) => {
            if (isSortableDisplayObject(contentObject)) {
              return (
                <>
                  <li
                    className="h-10 bg-manatee-100 flex items-center justify-end w-full"
                    key={contentObject.id}
                  >
                    {index < sortableObjects.length - 1 && (
                      <PanelSeparator transparent={inEditMode} />
                    )}
                  </li>
                </>
              );
            }
            return (
              <SortableItem
                key={contentObject.id}
                sortableId={contentObject.id}
                contentObject={contentObject}
                inEditMode={inEditMode}
                arrIndex={index}
                arrLength={sortableObjects.length}
                removeItem={removeItem}
                handleManualOrderChange={handleManualOrderChange}
                setPanelObject={setPanelObject}
              />
            );
          })}
        </ul>
      </SortableContext>
      <DisplayGraphQLQuery
        label="Get Object Content"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
      <PanelLoading
        isLoading={
          (isLoading && objectType.length === 0) ||
          hasNextPage ||
          isFetchingNextPage
        }
      >
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton
            key={`content-skeleton-${i}`}
            className="mb-2 h-11 w-full max-w-xl"
          />
        ))}
      </PanelLoading>
    </PanelSectionLayout>
  );
};
