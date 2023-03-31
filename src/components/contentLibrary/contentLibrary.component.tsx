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
import { m, useMotionValue, useTransform } from "framer-motion";
import React, { useEffect, useState, useRef, useCallback } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";
import { DROPPABLE_ID } from "src/constants/skylark";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";

const INITIAL_PANEL_PERCENTAGE = 70;
const MINIMUM_SIZES = {
  objectListing: 425,
  panel: 450,
};

export const ContentLibrary = () => {
  const [activePanelObject, setActivePanelObject] =
    useState<SkylarkObjectIdentifier | null>(null);
  const [draggedObject, setDraggedObject] = useState<
    ParsedSkylarkObject | undefined
  >(undefined);
  const [droppedObject, setDroppedObject] = useState<
    ParsedSkylarkObject | undefined
  >(undefined);
  const [windowSize, setWindowSize] = useState(0);
  const mousePosition = useRef(0);

  const objectListingWidth = useMotionValue<number | undefined>(undefined);
  const panelWidth = useTransform(objectListingWidth, (width) =>
    width === undefined
      ? undefined
      : windowSize < MINIMUM_SIZES.panel
      ? windowSize
      : windowSize - width,
  );
  const lastPanelWidth = useMotionValue<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const closePanel = () => {
    lastPanelWidth.set(panelWidth.get());
    setActivePanelObject(null);
  };

  useEffect(() => {
    const handleMouseClick = (event: MouseEvent) => {
      mousePosition.current = event.clientX;
    };
    const updateWindowSize = () => {
      setWindowSize(window.innerWidth);
    };
    updateWindowSize();

    window.addEventListener("mousedown", handleMouseClick);
    window.addEventListener("resize", updateWindowSize);
    return () => {
      window.removeEventListener("resize", updateWindowSize);
      window.removeEventListener("mousedown", handleMouseClick);
    };
  }, []);

  const panelIsOpen = !!activePanelObject;
  useEffect(() => {
    if (panelIsOpen) {
      const newObjectListingWidth =
        (INITIAL_PANEL_PERCENTAGE * windowSize) / 100;
      const previousPanelWidth = lastPanelWidth.get();
      const computedPanelWidth =
        previousPanelWidth || windowSize - newObjectListingWidth;
      // Never open the Panel too small
      const newPanelWidth =
        computedPanelWidth >= MINIMUM_SIZES.panel
          ? computedPanelWidth
          : MINIMUM_SIZES.panel;
      objectListingWidth.set(windowSize - newPanelWidth);
      lastPanelWidth.set(undefined);
    } else {
      objectListingWidth.set(windowSize);
    }
  }, [panelIsOpen, objectListingWidth, windowSize, lastPanelWidth]);

  const handleDrag = useCallback(
    (_: PointerEvent, info: { delta: { x: number } }) => {
      const width = objectListingWidth.get() || windowSize || 0;
      const newObjectListingWidth = width + info.delta.x;
      if (
        newObjectListingWidth > MINIMUM_SIZES.objectListing &&
        newObjectListingWidth < windowSize - MINIMUM_SIZES.panel
      ) {
        objectListingWidth.set(newObjectListingWidth);
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
          <div className="max-w-[350px] items-center rounded-sm border border-manatee-200 bg-white px-2">
            <ObjectIdentifierCard object={draggedObject} />
          </div>
        ) : null}
      </DragOverlay>
      <div
        className="flex h-screen w-full flex-row overflow-x-hidden"
        ref={containerRef}
        style={{
          maxHeight: `calc(100vh - 4rem)`,
        }}
      >
        <m.div
          className={clsx(
            "w-full max-w-full pt-6 pl-2 md:pl-6 lg:pl-10",
            activePanelObject && "md:w-1/2 lg:w-5/12 xl:w-3/5",
          )}
          style={{ width: activePanelObject ? objectListingWidth : "100%" }}
        >
          <ObjectList
            withCreateButtons
            setPanelObject={setActivePanelObject}
            isPanelOpen={!!activePanelObject}
            isDragging={!!draggedObject}
          />
        </m.div>
        {activePanelObject && (
          <m.div
            className="fixed z-50 flex h-full w-full grow flex-row bg-white md:relative md:z-auto"
            style={{ width: activePanelObject ? panelWidth : 0 }}
          >
            <m.div
              data-testid="drag-bar"
              key={windowSize}
              className="hidden w-3 cursor-col-resize items-center bg-manatee-100 lg:flex "
              onDrag={handleDrag}
              onDragStart={() => {
                if (containerRef.current) {
                  containerRef.current.classList.add("select-none");
                }
              }}
              onDragEnd={() => {
                if (containerRef.current)
                  containerRef.current.classList.remove("select-none");
              }}
              drag="x"
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0}
              dragMomentum={false}
            >
              <div className="mx-1 h-20 w-full rounded bg-manatee-600"></div>
            </m.div>
            <div className="w-full overflow-x-scroll">
              <Panel
                closePanel={closePanel}
                uid={activePanelObject.uid}
                objectType={activePanelObject.objectType}
                language={activePanelObject.language}
                showDropArea={!!draggedObject}
                droppedObject={droppedObject}
                clearDroppedObject={() => setDroppedObject(undefined)}
              />
            </div>
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
