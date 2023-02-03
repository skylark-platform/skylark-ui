import clsx from "clsx";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import React, { useEffect, useState } from "react";

import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";

export const ContentLibrary = () => {
  const [activePanelObject, setActivePanelObject] = useState<{
    objectType: string;
    uid: string;
  } | null>(null);

  const [windowSize, setWindowSize] = useState(500);
  const panelWidth = useMotionValue(500); // from localstorage get saved sized

  useEffect(() => {
    window.addEventListener("resize", () => {
      setWindowSize(window.innerWidth);
    });
  }, []);

  const handleDrag = React.useCallback(
    (event, info) => {
      const newWidth = panelWidth.get() + info.delta.x;
      if (newWidth > 500 && newWidth < 900) {
        panelWidth.set(newWidth);
      }
    },
    [panelWidth],
  );

  return (
    <div
      className="mx-4 flex h-screen flex-row"
      style={{
        maxHeight: `calc(100vh - 4rem)`,
      }}
    >
      <motion.div className={" max-w-full grow pt-6"}>
        <ObjectList withCreateButtons onInfoClick={setActivePanelObject} />
      </motion.div>

      <motion.div
        className="flex"
        style={{
          width: activePanelObject ? panelWidth : "100%",
        }}
      >
        {activePanelObject && (
          <>
            <motion.div
              className="flex w-3 cursor-col-resize items-center bg-manatee-100"
              // id="dragMe"
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
