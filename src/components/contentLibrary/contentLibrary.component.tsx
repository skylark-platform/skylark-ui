import clsx from "clsx";
import { m, useMotionValue } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";

import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";

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

  return (
    <div
      className="flex h-screen flex-row"
      style={{
        maxHeight: `calc(100vh - 4rem)`,
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
          />
        </m.div>
      )}
    </div>
  );
};
