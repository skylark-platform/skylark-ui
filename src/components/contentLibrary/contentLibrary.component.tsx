import clsx from "clsx";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";

import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";

export const ContentLibrary = () => {
  const [activePanelObject, setActivePanelObject] = useState<{
    objectType: string;
    uid: string;
  } | null>(null);

  const [windowSize, setWindowSize] = useState(0);
  const objectListingWidth = useMotionValue<number | undefined>(undefined); // from localstorage get saved sized
  const objectListingRef = useRef(null);

  console.log("window size", windowSize);
  console.log("panelWidth", objectListingWidth);

  useEffect(() => {
    window.addEventListener("resize", () => {
      setWindowSize(window.innerWidth);
      // panelWidth.set(window.innerWidth / 2);
    });
  }, [objectListingWidth]);

  const handleDrag = React.useCallback(
    (event, info) => {
      const width =
        objectListingWidth.get() || objectListingRef?.current?.offsetWidth;
      const newWidth = width + info.delta.x;

      console.log("panelWidth", objectListingWidth.get());
      console.log("width", width);
      console.log("newWidth", newWidth);

      if (newWidth > 450) {
        objectListingWidth.set(newWidth);
      }
    },
    [objectListingWidth],
  );

  const objecListingSize = clsx(
    activePanelObject ? "w-full md:w-1/3 lg:w-5/12 xl:w-3/5" : "w-full",
  );

  return (
    <div
      className="ml-4 flex h-screen flex-row "
      style={{
        maxHeight: `calc(100vh - 4rem)`,
      }}
    >
      <motion.div
        ref={objectListingRef}
        className={`max-w-full pt-6 ${objecListingSize}`}
        style={{
          width:
            activePanelObject && objectListingWidth ? objectListingWidth : "",
        }}
      >
        <ObjectList withCreateButtons onInfoClick={setActivePanelObject} />
      </motion.div>

      <motion.div className="z-60 fixed flex h-full grow flex-row bg-white md:relative md:z-auto">
        {activePanelObject && (
          <>
            <motion.div
              key={windowSize}
              className="hidden w-3 cursor-col-resize items-center bg-manatee-100 md:overflow-auto "
              onDrag={handleDrag}
              drag="x"
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0}
              dragMomentum={false}
            >
              <div className="mx-1 h-20 w-full rounded bg-manatee-600"></div>
            </motion.div>
            <Panel
              closePanel={() => setActivePanelObject(null)}
              uid={activePanelObject.uid}
              objectType={activePanelObject.objectType}
            />
          </>
        )}
      </motion.div>
    </div>
  );
};
