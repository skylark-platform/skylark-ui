import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  getClientRect,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import clsx from "clsx";
import { m, useMotionValue } from "framer-motion";
import React, { useEffect, useState, useRef, useCallback } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";
import { DROPPABLE_ID } from "src/constants/skylark";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

export const ContentLibrary = () => {
  const [activePanelObject, setActivePanelObject] = useState<{
    objectType: string;
    uid: string;
  } | null>(null);
  const [draggedObject, setDraggedObject] = useState<
    ParsedSkylarkObject | undefined
  >(undefined);
  const [droppedObject, setDroppedObject] = useState<
    ParsedSkylarkObject | undefined
  >(undefined);
  const [windowSize, setWindowSize] = useState(0);
  const mousePosition = useRef(0);

  const objectListingWidth = useMotionValue<number | undefined>(undefined);
  const objectListingRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize(window.innerWidth);
      if (!activePanelObject) objectListingWidth.set(undefined);
    };
    updateWindowSize();

    window.addEventListener("resize", updateWindowSize);
    return () => {
      window.removeEventListener("resize", updateWindowSize);
    };
  }, [activePanelObject, objectListingWidth]);

  useEffect(() => {
    const handleMouseClick = (event: MouseEvent) => {
      mousePosition.current = event.clientX;
    };

    window.addEventListener("mousedown", handleMouseClick);

    return () => {
      window.removeEventListener("mousedown", handleMouseClick);
    };
  }, []);

  const handleDrag = useCallback(
    (_: PointerEvent, info: { delta: { x: number } }) => {
      const width =
        objectListingWidth.get() || objectListingRef?.current?.offsetWidth || 0;
      const newWidth = width + info.delta.x;
      if (newWidth > 425 && newWidth < windowSize - 375) {
        objectListingWidth.set(newWidth);
      }
    },
    [objectListingWidth, windowSize],
  );

  const handleMeasure = (element: HTMLElement) => {
    return {
      ...getClientRect(element),
      left: mousePosition.current,
    };
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
  );

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      measuring={{
        draggable: {
          measure: handleMeasure,
        },
      }}
    >
      <DragOverlay zIndex={100} dropAnimation={null}>
        {draggedObject ? (
          <div className="max-w-[350px] items-center border border-manatee-400 bg-white ">
            <ObjectIdentifierCard contentObject={draggedObject} />
          </div>
        ) : null}
      </DragOverlay>
      <div
        className="flex h-screen flex-row"
        style={{
          maxHeight: `calc(100vh - 5rem)`,
        }}
      >
        <m.div
          ref={objectListingRef}
          className={clsx(
            "w-full max-w-full pt-6 pl-2 md:pl-6 lg:pl-10",
            activePanelObject && "md:w-1/2 lg:w-5/12 xl:w-3/5",
          )}
          style={{
            width:
              activePanelObject && objectListingWidth
                ? objectListingWidth
                : "100%",
          }}
        >
          <ObjectList
            withCreateButtons
            onInfoClick={setActivePanelObject}
            isPanelOpen={!!activePanelObject}
            isDragging={!!draggedObject}
          />
        </m.div>

        {activePanelObject && (
          <m.div className="fixed z-50 flex h-full w-full grow flex-row bg-white md:relative md:z-auto">
            <m.div
              data-testid="drag-bar"
              key={windowSize}
              className="hidden w-3 cursor-col-resize items-center bg-manatee-100 lg:flex "
              onDrag={handleDrag}
              drag="x"
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0}
              dragMomentum={false}
            >
              <div className="mx-1 h-20 w-full rounded bg-manatee-600"></div>
            </m.div>
            <Panel
              closePanel={() => setActivePanelObject(null)}
              uid={activePanelObject.uid}
              objectType={activePanelObject.objectType}
              showDropArea={!!draggedObject}
              droppedObject={droppedObject}
              clearDroppedObject={() => setDroppedObject(undefined)}
            />
          </m.div>
        )}
      </div>
    </DndContext>
  );

  function handleDragStart(event: DragStartEvent) {
    setDraggedObject(event.active.data.current?.object);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.over && event.over.id === DROPPABLE_ID) {
      setDroppedObject(draggedObject);
    }
    setDraggedObject(undefined);
  }
};
