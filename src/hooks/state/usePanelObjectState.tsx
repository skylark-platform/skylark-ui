import { useState, useCallback, useMemo } from "react";

import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

export enum PanelTab {
  Metadata = "Metadata",
  Imagery = "Imagery",
  Playback = "Playback",
  Availability = "Availability",
  AvailabilityDimensions = "Dimensions",
  AvailabilityAssignedTo = "Assigned To",
  Content = "Content",
  ContentOf = "Appears In",
  Relationships = "Relationships",
}

export interface PanelObject extends SkylarkObjectIdentifier {
  tab: PanelTab;
}

export const usePanelObjectState = (initialPanelState?: PanelObject) => {
  const [panelState, setPanelState] = useState<{
    activePanelState: PanelObject | null;
    previousPanelStates: PanelObject[];
    forwardPanelStates: PanelObject[];
  }>({
    activePanelState: initialPanelState || null,
    previousPanelStates: [],
    forwardPanelStates: [],
  });

  const setPanelObject = useCallback(
    (newPanelObject: SkylarkObjectIdentifier, tab?: PanelTab) => {
      setPanelState((oldState) => ({
        forwardPanelStates: [],
        previousPanelStates: oldState.activePanelState
          ? [...oldState.previousPanelStates, oldState.activePanelState]
          : oldState.previousPanelStates,
        activePanelState: {
          ...newPanelObject,
          tab: tab || PanelTab.Metadata,
        },
      }));
    },
    [],
  );

  const setPanelTab = useCallback((newTab: PanelTab) => {
    setPanelState((oldState) =>
      oldState.activePanelState
        ? {
            ...oldState,
            activePanelState: {
              ...oldState.activePanelState,
              tab: newTab,
            },
          }
        : oldState,
    );
  }, []);

  const navigateToPreviousPanelObject = useCallback(() => {
    setPanelState((oldState) =>
      oldState.previousPanelStates.length > 0
        ? {
            previousPanelStates: oldState.previousPanelStates.slice(0, -1),
            forwardPanelStates: oldState.activePanelState
              ? [...oldState.forwardPanelStates, oldState.activePanelState]
              : oldState.forwardPanelStates,
            activePanelState:
              oldState.previousPanelStates[
                oldState.previousPanelStates.length - 1
              ],
          }
        : oldState,
    );
  }, []);

  const navigateToForwardPanelObject = useCallback(() => {
    setPanelState((oldState) => ({
      previousPanelStates: oldState.activePanelState
        ? [...oldState.previousPanelStates, oldState.activePanelState]
        : oldState.previousPanelStates,
      forwardPanelStates: oldState.forwardPanelStates.slice(0, -1),
      activePanelState:
        oldState.forwardPanelStates[oldState.forwardPanelStates.length - 1],
    }));
  }, []);

  const resetPanelObjectState = useCallback(() => {
    setPanelState({
      activePanelState: null,
      previousPanelStates: [],
      forwardPanelStates: [],
    });
  }, []);

  const activePanelObject: SkylarkObjectIdentifier | null = useMemo(
    () =>
      panelState.activePanelState?.uid === undefined ||
      panelState.activePanelState?.objectType === undefined ||
      panelState.activePanelState?.language === undefined
        ? null
        : {
            uid: panelState.activePanelState?.uid,
            objectType: panelState.activePanelState?.objectType,
            language: panelState.activePanelState?.language,
          },
    [
      panelState.activePanelState?.language,
      panelState.activePanelState?.objectType,
      panelState.activePanelState?.uid,
    ],
  );

  return {
    activePanelObject,
    activePanelTab: panelState.activePanelState?.tab || PanelTab.Metadata,
    setPanelObject,
    setPanelTab,
    navigateToPreviousPanelObject:
      panelState.previousPanelStates.length > 0
        ? navigateToPreviousPanelObject
        : undefined,
    navigateToForwardPanelObject:
      panelState.forwardPanelStates.length > 0
        ? navigateToForwardPanelObject
        : undefined,
    resetPanelObjectState,
  };
};
