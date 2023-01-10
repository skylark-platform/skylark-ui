import { useCallback, useEffect, useState } from "react";

export function usePanel() {
  const [isPanelOpen, setPanelOpen] = useState(false);
  console.log("isPanelOpen", isPanelOpen);
  useEffect(() => {
    console.log("useffect", isPanelOpen);
    //return () => setPanelOpen(!isPanelOpen);
  }, [isPanelOpen, setPanelOpen]);

  // const toggle = () => setPanelOpen(!isPanelOpen);
  const toggle = useCallback(
    () => setPanelOpen((isPanelOpen) => !isPanelOpen),
    [],
  );

  return { isPanelOpen, toggle };
}
