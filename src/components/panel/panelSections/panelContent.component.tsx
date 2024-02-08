import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDndMonitor,
  DragOverlay,
  useDroppable,
  useDndContext,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Reorder } from "framer-motion";
import { CSSProperties, Ref, forwardRef, useEffect, useState } from "react";

import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  HandleDropError,
  convertSkylarkObjectToContentObject,
  handleDroppedContents,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { DROPPABLE_ID } from "src/constants/skylark";
import { useGetObjectContent } from "src/hooks/objects/get/useGetObjectContent";
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
  showDropZone?: boolean;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

const DISPLAY_OBJ_ID = "display-object";

const PanelContentItemOrderInput = ({
  hasMoved,
  isNewObject,
  position,
  disabled,
  maxPosition,
  onBlur,
}: {
  hasMoved: boolean;
  isNewObject?: boolean;
  position: number;
  disabled: boolean;
  maxPosition: number;
  onBlur: (n: number) => void;
}) => {
  const [value, setValue] = useState<number | "">(position);

  useEffect(() => {
    setValue(position);
  }, [position]);

  const onChange = (newValue: string) => {
    if (newValue === "") {
      setValue("");
      return;
    }
    const int = parseInt(newValue);
    if (!Number.isNaN(int)) setValue(int);
  };

  const onBlurWrapper = () => {
    if (value === "") {
      onBlur(position);
    } else if (value >= 1 && value <= maxPosition) {
      onBlur(value);
    } else {
      // If the value is less than 0 or more than the maximum allowed position, normalise it
      const minMaxedValue = value < 1 ? 1 : maxPosition;
      onBlur(minMaxedValue);
      setValue(minMaxedValue);
    }
  };

  return (
    <input
      type="text"
      disabled={disabled}
      size={value.toString().length || 1}
      style={{
        // Safari darkens the text on a disabled input
        WebkitTextFillColor: "#fff",
      }}
      className={clsx(
        "flex h-6 min-w-6 items-center justify-center rounded-full px-1 pb-0.5 text-center transition-colors",
        !isNewObject &&
          (!hasMoved || disabled) &&
          "bg-brand-primary text-white",
        !isNewObject && hasMoved && "bg-warning text-warning-content",
        isNewObject && "bg-success",
      )}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlurWrapper}
      value={value}
    />
  );
};

interface ContentObjectProps {
  sortableId: string;
  contentObject: ParsedSkylarkObjectContentObject;
  inEditMode?: boolean;
  arrIndex: number;
  arrLength: number;
  style?: CSSProperties;
  setPanelObject: PanelContentProps["setPanelObject"];
  removeItem: (uid: string) => void;
  handleManualOrderChange: (
    currentIndex: number,
    updatedPosition: number,
  ) => void;
}

const ContentObject = forwardRef(
  (
    {
      contentObject,
      inEditMode,
      arrIndex,
      arrLength,
      removeItem,
      setPanelObject,
      handleManualOrderChange,
      ...props
    }: ContentObjectProps,
    ref: Ref<HTMLDivElement>,
  ) => {
    const { object, config, meta, position } = contentObject;
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
    return (
      <div ref={ref} {...props}>
        <ObjectIdentifierCard
          object={parsedObject}
          onForwardClick={setPanelObject}
          disableForwardClick={inEditMode}
          disableDeleteClick={!inEditMode}
          onDeleteClick={() => removeItem(object.uid)}
        >
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
            <PanelContentItemOrderInput
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
        </ObjectIdentifierCard>
      </div>
    );
  },
);
ContentObject.displayName = "ContentObject";

const SortableItem = (props: ContentObjectProps) => {
  const { sortableId, inEditMode, arrIndex, arrLength } = props;

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
      dragOverlay: <div className="p-1 bg-blue-400">weeeeeee</div>,
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
      <ContentObject
        {...props}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      />
      {arrIndex < arrLength - 1 && <PanelSeparator transparent={inEditMode} />}
    </>
  );
};

export const PanelContent = ({
  isPage,
  objects: updatedObjects,
  inEditMode,
  showDropZone,
  objectType,
  uid,
  language,
  setContentObjects,
  setPanelObject,
}: PanelContentProps) => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, query, variables } =
    useGetObjectContent(objectType, uid, { language, fetchAvailability: true });

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

  const [overRowIndex, setOverRowIndex] = useState<number | null>(null);

  const preppedObjects = objects?.map((object) => ({
    ...object,
    id: hasProperty(object, "id")
      ? (object.id as string)
      : generateSortableObjectId(
          {
            uid: object.object.uid,
            objectType: object.object.__typename as string,
            meta: { language: object.meta.language },
          },
          "PANEL_CONTENT",
        ),
  }));

  const sortableObjects =
    overRowIndex !== null && preppedObjects
      ? insertAtIndex(preppedObjects, overRowIndex, {
          id: DISPLAY_OBJ_ID,
        } as { id: string } & ParsedSkylarkObjectContentObject)
      : preppedObjects || [];

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (
      event.active.data.current.type === DragType.CONTENT_LIBRARY_OBJECT &&
      over &&
      objects
    ) {
      const overIndex = over?.data?.current?.sortable.index;

      if (over.id !== DROPPABLE_ID.panelContentSortable) {
        setOverRowIndex(
          typeof overIndex === "number" && overIndex > -1 ? overIndex : null,
        );
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("DRAG_END", { active, over });
    const overContainer = over?.data.current?.sortable?.containerId || over?.id;

    if (
      objects &&
      sortableObjects &&
      over &&
      overContainer === DROPPABLE_ID.panelContentSortable &&
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

      console.log({ oldIndex, newIndex });

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
    id: DROPPABLE_ID.panelContentSortable,
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
        id={DROPPABLE_ID.panelContentSortable}
        items={sortableObjects}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={clsx(
            "h-full w-full flex-grow border border-transparent border-dashed",
            showDropZone &&
              (!objects || objects.length < 8) &&
              "border-brand-primary",
          )}
        >
          {!isLoading &&
            objects?.length === 0 &&
            ((inEditMode && !isPage) || showDropZone ? (
              <p className="w-full text-left text-sm text-manatee-600 p-0.5">
                {
                  "Drag & Drop an object from the Content Library here to add as content."
                }
              </p>
            ) : (
              <PanelEmptyDataText />
            ))}
          {sortableObjects.map((contentObject, index) => {
            if (contentObject.id === DISPLAY_OBJ_ID) {
              return (
                <div className="h-10 bg-blue-100" key={contentObject.id}>
                  sdfsd
                </div>
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
        </div>
      </SortableContext>
      <DisplayGraphQLQuery
        label="Get Object Content"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
      <PanelLoading isLoading={isLoading || hasNextPage}>
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
