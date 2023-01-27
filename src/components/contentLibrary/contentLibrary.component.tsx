import clsx from "clsx";
import { useState } from "react";

import { ObjectList } from "src/components/objectListing";
import { Panel } from "src/components/panel";

export const ContentLibrary = () => {
  const [activePanelObject, setActivePanelObject] = useState<{
    objectType: string;
    uid: string;
  } | null>(null);
  return (
    <div className="flex flex-row">
      <div
        className={clsx(
          "w-full px-2 ",
          activePanelObject !== null && "md:w-3/5 xl:w-3/4",
          activePanelObject === null && " md:px-10",
        )}
      >
        <ObjectList withCreateButtons onInfoClick={setActivePanelObject} />
      </div>
      {activePanelObject && (
        <Panel
          closePanel={() => setActivePanelObject(null)}
          uid={activePanelObject.uid}
          objectType={activePanelObject.objectType}
        />
      )}
    </div>
  );
};
