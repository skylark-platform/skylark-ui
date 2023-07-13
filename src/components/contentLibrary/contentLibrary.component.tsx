import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  TouchSensor,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import clsx from "clsx";
import { m, useMotionValue, useTransform } from "framer-motion";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { MemoizedObjectSearch } from "src/components/objectSearch";
import { Panel } from "src/components/panel";
import { DROPPABLE_ID } from "src/constants/skylark";
import { usePanelObjectState } from "src/hooks/state";
import { useCheckedObjectsState } from "src/hooks/state";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

const INITIAL_PANEL_PERCENTAGE = 70;
const MINIMUM_SIZES = {
  objectListing: 425,
  panel: 450,
};

export const ContentLibrary = () => {
  const {
    activePanelObject,
    activePanelTab,
    setPanelObject,
    setPanelTab,
    navigateToPreviousPanelObject,
    navigateToForwardPanelObject,
    resetPanelObjectState,
  } = usePanelObjectState();

  const { checkedObjects, checkedUids, checkedObjectTypes, setCheckedObjects } =
    useCheckedObjectsState();

  const [draggedObject, setDraggedObject] = useState<
    ParsedSkylarkObject | undefined
  >(undefined);
  const [droppedObject, setDroppedObject] = useState<
    ParsedSkylarkObject[] | undefined
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
    resetPanelObjectState();
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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 6 pixels before activating
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedObject(undefined)}
      sensors={sensors}
      modifiers={[snapCenterToCursor]}
    >
      {typeof window !== "undefined" &&
        document?.body &&
        createPortal(
          <DragOverlay zIndex={99999999} dropAnimation={null}>
            {draggedObject ? (
              <div className="max-w-[350px] cursor-grabbing items-center rounded-sm border border-manatee-200 bg-white text-sm">
                {checkedObjects.length > 0 &&
                checkedUids.includes(draggedObject.uid) ? (
                  <p className="p-2">{`Add ${checkedObjects.length} ${
                    checkedObjectTypes.length === 1 ? checkedObjectTypes[0] : ""
                  } objects`}</p>
                ) : (
                  <ObjectIdentifierCard
                    className="px-2"
                    object={draggedObject}
                  />
                )}
              </div>
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      <div
        className="flex h-screen w-full flex-row overflow-x-hidden"
        ref={containerRef}
        style={{
          maxHeight: `calc(100vh - 4rem)`,
        }}
      >
        <m.div
          className={clsx(
            "relative w-full max-w-full pl-2 pt-6 md:pl-6 lg:pl-10",
            activePanelObject && "md:w-1/2 lg:w-5/12 xl:w-3/5",
            !!draggedObject && "pointer-events-none",
          )}
          style={{ width: activePanelObject ? objectListingWidth : "100%" }}
        >
          {!!draggedObject && (
            <div className="absolute inset-0 z-[100] block bg-black/5"></div>
          )}
          <MemoizedObjectSearch
            withCreateButtons
            panelObject={activePanelObject}
            setPanelObject={setPanelObject}
            isPanelOpen={!!activePanelObject}
            withObjectSelect
            checkedObjects={checkedObjects}
            onObjectCheckedChanged={setCheckedObjects}
          />
        </m.div>
        {activePanelObject && (
          <m.div
            className="fixed z-40 flex h-full w-full grow flex-row bg-white md:relative md:z-auto"
            style={{ width: activePanelObject ? panelWidth : 0 }}
          >
            <m.div
              data-testid="drag-bar"
              key={windowSize}
              className="hidden w-3 cursor-col-resize items-center bg-manatee-100 md:flex"
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
                key={`${activePanelObject.objectType}-${activePanelObject.uid}-${activePanelObject.language}`}
                object={activePanelObject}
                tab={activePanelTab}
                closePanel={closePanel}
                isDraggedObject={!!draggedObject}
                droppedObjects={droppedObject}
                setPanelObject={setPanelObject}
                setTab={setPanelTab}
                navigateToPreviousPanelObject={navigateToPreviousPanelObject}
                navigateToForwardPanelObject={navigateToForwardPanelObject}
                clearDroppedObjects={() => setDroppedObject(undefined)}
              />
            </div>
          </m.div>
        )}
      </div>
    </DndContext>
  );

  function handleDragStart(event: DragStartEvent) {
    setDraggedObject(event.active.data.current?.object);
    const el = document.getElementById("object-search-results");
    if (el) el.style.overflow = "hidden";
  }

  function handleDragEnd(event: DragEndEvent) {
    const el = document.getElementById("object-search-results");
    if (el) el.style.overflow = "";

    if (event.over && event.over.id === DROPPABLE_ID && draggedObject) {
      const draggedObjectIsChecked = checkedUids.includes(draggedObject.uid);

      // Like Gmail, if the dragged object is not checked, just use the dragged object
      setDroppedObject(
        draggedObjectIsChecked ? checkedObjects : [draggedObject],
      );
    }
    setDraggedObject(undefined);
  }
};
