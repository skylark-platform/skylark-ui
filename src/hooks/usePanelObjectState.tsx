import { useState, useCallback } from "react";

import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

export enum PanelTab {
  Metadata = "Metadata",
  Imagery = "Imagery",
  Availability = "Availability",
  AvailabilityDimensions = "Dimensions",
  Content = "Content",
  Relationships = "Relationships",
}

export interface PanelObject extends SkylarkObjectIdentifier {
  tab: PanelTab;
}

export const usePanelObjectState = (initialPanelState?: PanelObject) => {
  const [
    { activePanelState, previousPanelStates, forwardPanelStates },
    setPanelState,
  ] = useState<{
    activePanelState: PanelObject | null;
    previousPanelStates: PanelObject[];
    forwardPanelStates: PanelObject[];
  }>({
    activePanelState: initialPanelState || null,
    previousPanelStates: [],
    forwardPanelStates: [],
  });

  const setPanelObject = useCallback(
    (newPanelObject: SkylarkObjectIdentifier) => {
      setPanelState({
        forwardPanelStates: [],
        previousPanelStates: activePanelState
          ? [...previousPanelStates, activePanelState]
          : previousPanelStates,
        activePanelState: {
          ...newPanelObject,
          tab: PanelTab.Metadata,
        },
      });
    },
    [activePanelState, previousPanelStates],
  );

  const setPanelTab = useCallback(
    (newTab: PanelTab) => {
      if (activePanelState) {
        setPanelState({
          forwardPanelStates,
          previousPanelStates,
          activePanelState: {
            ...activePanelState,
            tab: newTab,
          },
        });
      }
    },
    [activePanelState, forwardPanelStates, previousPanelStates],
  );

  const navigateToPreviousPanelObject = useCallback(() => {
    const updatedPreviousPanelObjects = previousPanelStates;
    const previousPanelObject = updatedPreviousPanelObjects.pop();
    if (previousPanelObject) {
      setPanelState({
        previousPanelStates: updatedPreviousPanelObjects,
        forwardPanelStates: activePanelState
          ? [...forwardPanelStates, activePanelState]
          : forwardPanelStates,
        activePanelState: previousPanelObject,
      });
    }
  }, [activePanelState, forwardPanelStates, previousPanelStates]);

  const navigateToForwardPanelObject = useCallback(() => {
    const updatedFowardPanelObjects = forwardPanelStates;
    const forwardPanelObject = updatedFowardPanelObjects.pop();
    console.log({
      forwardPanelObject,
      forwardPanelStates,
      updatedFowardPanelObjects,
    });
    if (forwardPanelObject) {
      setPanelState({
        previousPanelStates: [...previousPanelStates, forwardPanelObject],
        forwardPanelStates: updatedFowardPanelObjects,
        activePanelState: forwardPanelObject,
      });
    }
  }, [forwardPanelStates, previousPanelStates]);

  const resetPanelObjectState = useCallback(() => {
    setPanelState({
      activePanelState: null,
      previousPanelStates: [],
      forwardPanelStates: [],
    });
  }, []);

  return {
    activePanelObject: activePanelState
      ? {
          uid: activePanelState.uid,
          objectType: activePanelState.objectType,
          language: activePanelState.language,
        }
      : null,
    activePanelTab: activePanelState?.tab || PanelTab.Metadata,
    setPanelObject,
    setPanelTab,
    navigateToPreviousPanelObject:
      previousPanelStates.length > 0
        ? navigateToPreviousPanelObject
        : undefined,
    navigateToForwardPanelObject:
      forwardPanelStates.length > 0 ? navigateToForwardPanelObject : undefined,
    resetPanelObjectState,
  };
};
