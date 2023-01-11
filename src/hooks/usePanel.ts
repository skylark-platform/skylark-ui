import { useState } from "react";

export function usePanel() {
  const [isPanelOpen, setPanelStatus] = useState(false);
  const [objectInfo, setObjectInfo] = useState<{
    uid: string;
    objectType: string;
  } | null>(null);

  function togglePanel() {
    setPanelStatus(!isPanelOpen);
  }

  function setPanelInfo(objectType: string, uid: string) {
    setObjectInfo({ objectType, uid });
    setPanelStatus(true);
  }

  return { isPanelOpen, togglePanel, setPanelInfo, objectInfo };
}
