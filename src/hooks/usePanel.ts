import { useState } from "react";

export function usePanel() {
  const [isPanelOpen, setPanelOpen] = useState(true);

  return { isPanelOpen, setPanelOpen };
}
