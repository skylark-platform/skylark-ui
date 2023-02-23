import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import clsx from "clsx";
import { m, useMotionValue } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";

import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";
import { ParsedSkylarkObjectContent } from "src/interfaces/skylark";

export const ContentLibrary = () => {
  const [activePanelObject, setActivePanelObject] = useState<{
    objectType: string;
    uid: string;
  } | null>(null);

  const [windowSize, setWindowSize] = useState(0);
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
  const [activeId, setActiveId] = useState(null);
  const [newObjects, setObjects] = useState([]);

  const handleDrag = React.useCallback(
    (event: PointerEvent, info: { delta: { x: number } }) => {
      const width =
        objectListingWidth.get() || objectListingRef?.current?.offsetWidth || 0;
      const newWidth = width + info.delta.x;
      if (newWidth > 425 && newWidth < windowSize - 375) {
        objectListingWidth.set(newWidth);
      }
    },
    [objectListingWidth, windowSize],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
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
      sensors={sensors}
    >
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
            activeId={activeId}
          />
        </m.div>

        {activePanelObject && (
          <m.div className="fixed z-50 flex h-full w-full grow flex-row bg-white drop-shadow-md md:relative md:z-auto lg:drop-shadow-none">
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
              activeId={activeId}
              newObjects={newObjects}
            />
          </m.div>
        )}
      </div>
    </DndContext>
  );

  function parse(obj: any) {
    return {
      config: obj.config,
      object: obj.metadata,
      objectType: obj.objectType,
      position: 6,
    };
  }

  function handleDragStart(event: any) {
    console.log("start", event.active.data.current.object);

    setActiveId(parse(event.active.data.current.object));
  }

  function handleDragEnd(event: any) {
    setActiveId(null);
    if (event.over && event.over.id === "droppable") {
      console.log("happy", event);
      const parsed = {
        ...event.active.data.current.record,
        activeId,
      };
      setObjects([activeId]);
    }
  }
};
