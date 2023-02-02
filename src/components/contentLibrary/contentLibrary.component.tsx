import clsx from "clsx";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import React, { useState } from "react";

import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";

export const ContentLibrary = () => {
  const [activePanelObject, setActivePanelObject] = useState<{
    objectType: string;
    uid: string;
  } | null>(null);

  const panelWidth = useMotionValue(500); // from localstorage

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
    <div className="flex h-screen flex-row ">
      <motion.div
        className={"w-full"}
        style={{
          width: activePanelObject ? panelWidth : "100%",
        }}
      >
        <ObjectList withCreateButtons onInfoClick={setActivePanelObject} />
      </motion.div>

      <div
        className="flex"
        style={{
          backgroundColor: "powderblue",
          textAlign: "center",
        }}
      >
        {activePanelObject && (
          <>
            <motion.div
              className="flex w-3 cursor-col-resize items-center rounded-md bg-black"
              // id="dragMe"
              onDrag={handleDrag}
              drag="x"
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0}
              dragMomentum={false}
            >
              <div className="mx-1 h-14 w-full rounded bg-white"></div>
            </motion.div>
            <Panel
              closePanel={() => setActivePanelObject(null)}
              uid={activePanelObject.uid}
              objectType={activePanelObject.objectType}
            />
          </>
        )}
      </div>
    </div>
  );
};
