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
import { convertSkylarkObjectToContentObject } from "src/components/panel/panel.lib";
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
  DragStartEvent,
  DragType,
  generateSortableObjectId,
  useSortable,
} from "src/lib/dndkit/dndkit";
import { hasProperty, insertAtIndex } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelContentProps extends SkylarkObjectIdentifier {
  isPage?: boolean;
  objects: AddedSkylarkObjectContentObject[] | null;
  setContentObjects: (contentObjects: {
    original: ParsedSkylarkObjectContentObject[] | null;
    updated: AddedSkylarkObjectContentObject[] | null;
  }) => void;
  inEditMode?: boolean;
  showDropZone?: boolean;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

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
    // <Reorder.Item
    //   key={`panel-content-item-${object.uid}`}
    //   value={contentObject}
    //   data-testid={`panel-object-content-item-${arrIndex + 1}`}
    //   data-cy={"panel-object-content-item"}
    //   className={clsx(
    //     "my-0 flex flex-col items-center justify-center",
    //     inEditMode && "cursor-pointer",
    //   )}
    //   dragListener={inEditMode}
    // >
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
    // </Reorder.Item>
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
  const sortableObjects = objects?.map((object) => ({
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

  useEffect(() => {
    if (!inEditMode && data) {
      setContentObjects({
        original: data,
        updated: data,
      });
    }
  }, [data, inEditMode, setContentObjects]);

  const onReorder = (updated: AddedSkylarkObjectContentObject[]) =>
    setContentObjects({
      original: data || null,
      updated,
    });

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

  // const handleDragStart = (event: DragStartEvent) => {
  //   const { active } = event;

  //   const object = objects?.find(({ object: { uid } }) => uid === active.id);

  //   if (object) {
  //     setDraggedObject(object);
  //   }
  // };

  const handleDragOver = (event: DragOverEvent) => {
    console.log("DRAG_OVER", event);
    const { active, over } = event;

    if (
      event.active.data.current.type === DragType.CONTENT_LIBRARY_OBJECT &&
      over &&
      objects
    ) {
      const activeContainer = active.data.current?.sortable?.containerId;
      const overContainer = over.data.current?.sortable?.containerId || over.id;
      const activeIndex = active.data.current?.sortable?.index;

      const overIndex = over?.data?.current?.sortable.index;
      // const overIndex =
      //   over.id in itemGroups
      //     ? itemGroups[overContainer].length + 1
      //     : over.data.current.sortable.index;

      console.log({
        activeContainer,
        overContainer,
        activeIndex,
        overIndex,
        over,
      });

      if (overContainer === DROPPABLE_ID.panelContentSortable) {
        const obj: ParsedSkylarkObject = active.data.current.object;

        const objIndex = objects.findIndex(
          ({ object: { uid } }) => uid === obj.uid,
        );

        if (objIndex > -1) {
          console.log({ objects, overIndex, obj });

          onReorder(arrayMove(objects, objIndex, overIndex));

          return;
        }

        const newObject = {
          ...convertSkylarkObjectToContentObject(obj),
          // id: active.id,
        };
        const updatedObjects = insertAtIndex(
          objects,
          overIndex || -1,
          newObject,
        );

        console.log({ updatedObjects, objects, overIndex, newObject });
        onReorder(updatedObjects);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("DRAG_END", { active, over });

    if (objects && sortableObjects && over) {
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

      console.log({ updatedObjectsWithIdFieldRemoved });
      onReorder(updatedObjectsWithIdFieldRemoved);
    }

    // setDraggedObject(null);
  };

  useDndMonitor({
    // onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
  });

  const { setNodeRef } = useDroppable({
    id: DROPPABLE_ID.panelContentSortable,
  });

  // if (showDropZone) {
  //   return <PanelDropZone />;
  // }

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
      {sortableObjects && (
        // <Reorder.Group
        //   axis="y"
        //   values={objects}
        //   onReorder={onReorder}
        //   data-testid="panel-content-items"
        //   className="flex-grow"
        // >
        // <DndContext
        //   sensors={sensors}
        //   collisionDetection={closestCenter}
        //   // onDragEnd={handleDragEnd}
        // >
        <>
          <SortableContext
            id={DROPPABLE_ID.panelContentSortable}
            items={sortableObjects}
            strategy={verticalListSortingStrategy}
          >
            {/* <div className="h-full w-full"> */}
            {!isLoading && objects?.length === 0 && <PanelEmptyDataText />}
            {sortableObjects.map((contentObject, index) => {
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
            {/* </Reorder.Group> */}
            {/* </div> */}
          </SortableContext>
          {/* <DragOverlay>
            {draggedObject ? (
              <div className="bg-white">
                <ContentObject
                  contentObject={draggedObject}
                  inEditMode={false}
                  arrIndex={0}
                  arrLength={0}
                  removeItem={() => ""}
                  sortableId={draggedObject.object.uid}
                  handleManualOrderChange={() => ""}
                  setPanelObject={() => ""}
                />
              </div>
            ) : null}
          </DragOverlay> */}
          {/* </DndContext> */}
        </>
      )}
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
      {inEditMode && !isPage && (
        <p className="w-full py-4 text-center text-sm text-manatee-600">
          {"Drag an object from the Content Library to add as content"}
        </p>
      )}
    </PanelSectionLayout>
  );
};
