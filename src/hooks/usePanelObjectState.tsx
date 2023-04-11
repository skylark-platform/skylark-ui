import { useState, useCallback } from "react";

import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

export const usePanelObjectState = (
  initialPanelObject?: SkylarkObjectIdentifier,
) => {
  const [{ activePanelObject, previousPanelObjects }, setPanelState] =
    useState<{
      activePanelObject: SkylarkObjectIdentifier | null;
      previousPanelObjects: SkylarkObjectIdentifier[];
    }>({
      activePanelObject: initialPanelObject || null,
      previousPanelObjects: [],
    });

  const setPanelObject = useCallback(
    (newPanelObject: SkylarkObjectIdentifier) => {
      setPanelState({
        previousPanelObjects: activePanelObject
          ? [...previousPanelObjects, activePanelObject]
          : previousPanelObjects,
        activePanelObject: newPanelObject,
      });
    },
    [activePanelObject, previousPanelObjects],
  );

  const navigateToPreviousPanelObject = () => {
    const updatedPreviousPanelObjects = previousPanelObjects;
    const previousPanelObject = updatedPreviousPanelObjects.pop();
    if (previousPanelObject) {
      setPanelState({
        previousPanelObjects: updatedPreviousPanelObjects,
        activePanelObject: previousPanelObject,
      });
    }
  };

  const resetPanelObjectState = () => {
    setPanelState({
      activePanelObject: null,
      previousPanelObjects: [],
    });
  };

  return {
    activePanelObject,
    setPanelObject,
    navigateToPreviousPanelObject:
      previousPanelObjects.length > 0
        ? navigateToPreviousPanelObject
        : undefined,
    resetPanelObjectState,
  };
};
