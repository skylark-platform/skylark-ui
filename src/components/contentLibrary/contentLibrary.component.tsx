import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import clsx from "clsx";
import { m, useMotionValue, useTransform } from "framer-motion";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { Panel } from "src/components/panel";
import { DROPPABLE_ID } from "src/constants/skylark";
import { PanelTab, usePanelObjectState } from "src/hooks/state";
import { useCheckedObjectsState } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import {
  Active,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragType,
} from "src/lib/dndkit/dndkit";

import { TabbedObjectSearchWithAccount } from "./tabbedObjectSearch/tabbedObjectSearch.component";

const INITIAL_PANEL_PERCENTAGE = 70;
const MINIMUM_SIZES = {
  objectListing: 425,
  panel: 450,
};

const ContentLibraryDragOverlay = ({
  activeDragged,
  checkedObjects,
  checkedUids,
  checkedObjectTypesForDisplay,
}: {
  activeDragged?: Active;
  checkedObjects: ParsedSkylarkObject[];
  checkedObjectTypesForDisplay: string[];
  checkedUids: string[];
}) => {
  // https://github.com/clauderic/dnd-kit/issues/818#issuecomment-1171367457
  if (activeDragged?.data.current.options?.dragOverlay) {
    return <>{activeDragged?.data.current.options.dragOverlay}</>;
  }

  if (activeDragged?.data.current.type === DragType.CONTENT_LIBRARY_OBJECT) {
    const draggedObject = activeDragged.data.current.object;
    return (
      <div className="max-w-[350px] cursor-grabbing items-center rounded-sm border border-manatee-200 bg-white text-sm">
        {checkedObjects.length > 0 &&
        checkedUids.includes(draggedObject.uid) ? (
          <p className="p-2">{`Add ${checkedObjects.length} ${
            checkedObjectTypesForDisplay.length === 1
              ? checkedObjectTypesForDisplay[0]
              : ""
          } objects`}</p>
        ) : (
          <ObjectIdentifierCard className="px-2" object={draggedObject} />
        )}
      </div>
    );
  }

  return null;
};

export const ContentLibrary = ({
  skipLogoAnimation,
}: {
  skipLogoAnimation?: boolean;
}) => {
  const {
    activePanelObject,
    activePanelTab,
    activePanelTabState,
    setPanelObject,
    setPanelTab,
    navigateToPreviousPanelObject,
    navigateToForwardPanelObject,
    resetPanelObjectState,
    updateActivePanelTabState,
  } = usePanelObjectState();

  const {
    checkedObjects,
    checkedObjectsState,
    checkedUids,
    checkedObjectTypesForDisplay,
    setCheckedObjectsState,
    resetCheckedObjects,
  } = useCheckedObjectsState();

  const [activeDragged, setActiveDragged] = useState<Active | null>(null);
  const isDraggingObject =
    (activeDragged &&
      activeDragged.data.current.type === DragType.CONTENT_LIBRARY_OBJECT) ||
    false;

  const [droppedObjects, setDroppedObjects] = useState<
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

  // const sensors = useSensors(
  //   useSensor(PointerSensor),
  //   useSensor(KeyboardSensor, {
  //     coordinateGetter: sortableKeyboardCoordinates,
  //   }),
  // );

  const dndModifiers = activeDragged?.data.current.options?.modifiers
    ? activeDragged.data.current.options.modifiers
    : [snapCenterToCursor];

  const clearDroppedObjects = useCallback(
    () => setDroppedObjects(undefined),
    [],
  );

  return (
    <DndContext
      onDragStart={handleDragStart}
      // onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragged(null)}
      sensors={sensors}
      modifiers={dndModifiers}
      collisionDetection={
        activeDragged?.data.current.options?.collisionDetection
      }
    >
      {typeof window !== "undefined" && document?.body && (
        <>
          {createPortal(
            <DragOverlay zIndex={99999999} dropAnimation={null}>
              {activeDragged ? (
                <ContentLibraryDragOverlay
                  activeDragged={activeDragged}
                  checkedObjects={checkedObjects}
                  checkedUids={checkedUids}
                  checkedObjectTypesForDisplay={checkedObjectTypesForDisplay}
                />
              ) : null}
            </DragOverlay>,
            document.body,
          )}
        </>
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
            "relative h-full w-full max-w-full",
            activePanelObject && "md:w-1/2 lg:w-5/12 xl:w-3/5",
            isDraggingObject && "pointer-events-none",
          )}
          style={{ width: activePanelObject ? objectListingWidth : "100%" }}
        >
          {isDraggingObject && (
            <div className="absolute inset-0 z-[100] block bg-black/5"></div>
          )}
          <TabbedObjectSearchWithAccount
            id="content-library-search"
            panelObject={activePanelObject}
            setPanelObject={setPanelObject}
            isPanelOpen={!!activePanelObject}
            withObjectSelect
            checkedObjectsState={checkedObjectsState}
            onObjectCheckedChanged={setCheckedObjectsState}
            resetCheckedObjects={resetCheckedObjects}
            skipLogoAnimation={skipLogoAnimation}
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
              className="hidden w-3 cursor-pointer items-center bg-manatee-100 md:flex"
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
              onDoubleClick={() => {
                const halfWindowWidth = window.innerWidth / 2;

                const newObjectListingWidth =
                  panelWidth.get() === halfWindowWidth
                    ? window.innerWidth - MINIMUM_SIZES.panel
                    : halfWindowWidth;
                objectListingWidth.set(newObjectListingWidth);
              }}
            >
              <div className="mx-1 h-20 w-full rounded bg-manatee-600"></div>
            </m.div>
            <div className="w-full overflow-x-scroll">
              <Panel
                key={`${activePanelObject.objectType}-${activePanelObject.uid}-${activePanelObject.language}`}
                object={activePanelObject}
                tab={activePanelTab}
                tabState={activePanelTabState}
                closePanel={closePanel}
                isDraggedObject={isDraggingObject}
                droppedObjects={droppedObjects}
                setPanelObject={setPanelObject}
                setTab={setPanelTab}
                navigateToPreviousPanelObject={navigateToPreviousPanelObject}
                navigateToForwardPanelObject={navigateToForwardPanelObject}
                clearDroppedObjects={clearDroppedObjects}
                updateActivePanelTabState={updateActivePanelTabState}
              />
            </div>
          </m.div>
        )}
      </div>
    </DndContext>
  );

  function handleDragStart(event: DragStartEvent) {
    console.log("handleDragStartContentLibrary", event);
    const type = event.active.data.current.type;
    if (type === DragType.CONTENT_LIBRARY_OBJECT) {
      setActiveDragged(event.active);

      if (
        [PanelTab.Metadata, PanelTab.Imagery, PanelTab.Playback].includes(
          activePanelTab,
        )
      ) {
        if (
          event.active.data.current.object.objectType ===
          BuiltInSkylarkObjectType.Availability
        ) {
          setPanelTab(PanelTab.Availability);
        } else {
          setPanelTab(PanelTab.Relationships);
        }
      }
    }

    if (type === DragType.OBJECT_SEARCH_MODIFY_FROZEN_COLUMNS) {
      setActiveDragged(event.active);
    }

    if (type === DragType.PANEL_CONTENT_REORDER_OBJECTS) {
      console.log("[PANEL_CONTENT_REORDER_OBJECTS] start", type, { event });
      setActiveDragged(event.active);
    }
  }

  // function handleDragOver(event: DragOverEvent) {
  //   console.log("contentLibrary OVER", { event, activeDragged });
  // }

  function handleDragEnd(event: DragEndEvent) {
    if (
      event.over &&
      event.over.id === DROPPABLE_ID.panelGeneric &&
      event.active.data.current.type === DragType.CONTENT_LIBRARY_OBJECT &&
      activeDragged?.data.current.type === DragType.CONTENT_LIBRARY_OBJECT
    ) {
      const draggedObject = activeDragged?.data.current.object;
      const draggedObjectIsChecked = checkedUids.includes(
        activeDragged.data.current.object.uid,
      );

      // Like Gmail, if the dragged object is not checked, just use the dragged object
      setDroppedObjects(
        draggedObjectIsChecked ? checkedObjects : [draggedObject],
      );
    }
    if (activeDragged) setActiveDragged(null);
  }
};
