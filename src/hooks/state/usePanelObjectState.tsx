import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { useState, useCallback, useMemo, useEffect } from "react";

import { SEGMENT_KEYS } from "src/constants/segment";
import {
  ParsedSkylarkObjectAvailabilityObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { isObjectsDeepEqual } from "src/lib/utils";
import { segment } from "src/lib/analytics/segment";

export enum PanelTab {
  Metadata = "Metadata",
  Imagery = "Imagery",
  Playback = "Video",
  Availability = "Availability",
  AvailabilityDimensions = "Dimensions",
  AvailabilityAssignedTo = "Assigned To",
  Content = "Content",
  ContentOf = "Appears In",
  Relationships = "Relationships",
}

export interface PanelTabState {
  [PanelTab.Relationships]: {
    active: string | null;
  };
  [PanelTab.Availability]: {
    active: {
      object: ParsedSkylarkObjectAvailabilityObject;
      tabId: string;
    } | null;
  };
  [PanelTab.AvailabilityAssignedTo]: {
    filters: {
      objectType: string;
      hideInherited: boolean;
    } | null;
  };
}

export interface PanelObject extends SkylarkObjectIdentifier {
  tab: PanelTab;
  tabState: PanelTabState;
}

export interface PanelUrlQuery {
  panelUid?: string;
  panelObjectType?: string;
  panelLanguage?: string;
  panelTab?: string;
}

export const defaultPanelTabState: PanelTabState = {
  [PanelTab.Relationships]: {
    active: null,
  },
  [PanelTab.Availability]: {
    active: null,
  },
  [PanelTab.AvailabilityAssignedTo]: {
    filters: null,
  },
};

const createPanelUrlQuery = (object: Partial<PanelObject>) => {
  const obj: PanelUrlQuery = {};
  if (object.uid) {
    obj.panelUid = object.uid;
  }

  if (object.objectType) {
    obj.panelObjectType = object.objectType;
  }

  if (object.language) {
    obj.panelLanguage = object.language;
  }

  if (object.tab) {
    obj.panelTab = object.tab;
  }

  if (Object.keys(object).length === 0) {
    return null;
  }

  return obj;
};

export const readPanelUrlQuery = (query: Partial<PanelUrlQuery>) => {
  const currentPanelQuery: PanelUrlQuery = {
    panelUid: query?.panelUid,
    panelObjectType: query?.panelObjectType,
    panelLanguage: query?.panelLanguage,
    panelTab: query?.panelTab,
  };

  return currentPanelQuery;
};

const urlQueryWithoutPanelQuery = (query: ParsedUrlQuery) => {
  const cleanedQuery = { ...query };
  const keys: (keyof PanelUrlQuery)[] = [
    "panelUid",
    "panelObjectType",
    "panelLanguage",
    "panelTab",
  ];

  // Delete existing keys
  keys.forEach((key) => delete cleanedQuery[key]);

  return cleanedQuery;
};

export const mergedPanelTabStates = (
  previousState: PanelTabState,
  newState?: Partial<PanelTabState>,
): PanelTabState => {
  return {
    [PanelTab.Relationships]: {
      ...previousState[PanelTab.Relationships],
      ...newState?.[PanelTab.Relationships],
    },
    [PanelTab.Availability]: {
      ...previousState[PanelTab.Availability],
      ...newState?.[PanelTab.Availability],
    },
    [PanelTab.AvailabilityAssignedTo]: {
      ...previousState[PanelTab.AvailabilityAssignedTo],
      ...newState?.[PanelTab.AvailabilityAssignedTo],
    },
  };
};

export const usePanelObjectState = (initialPanelState?: PanelObject) => {
  const { replace, query } = useRouter();

  const updatePanelUrlQuery = useCallback(
    (newPanelState: PanelObject | null) => {
      if (!newPanelState) {
        return;
      }

      const currentPanelQuery = readPanelUrlQuery(query);

      const cleanedQuery = urlQueryWithoutPanelQuery(query);

      const newPanelQuery = createPanelUrlQuery({
        ...newPanelState,
      });

      if (
        newPanelQuery &&
        (!currentPanelQuery ||
          !isObjectsDeepEqual(
            currentPanelQuery as Record<string, string>,
            newPanelQuery as Record<string, string>,
          ))
      ) {
        replace(
          {
            query: {
              ...cleanedQuery,
              ...newPanelQuery,
            },
          },
          undefined,
          { shallow: true },
        );
      }
    },
    [replace, query],
  );

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
    (
      newPanelObject: SkylarkObjectIdentifier,
      tab?: PanelTab,
      tabState?: Partial<PanelTabState>,
    ) => {
      segment.track(SEGMENT_KEYS.panel.objectChange, {
        newPanelObject,
        tab,
        tabState,
      });

      setPanelState((oldState) => ({
        forwardPanelStates: [],
        previousPanelStates: oldState.activePanelState
          ? [...oldState.previousPanelStates, oldState.activePanelState]
          : oldState.previousPanelStates,
        activePanelState: {
          ...newPanelObject,
          tab: tab || PanelTab.Metadata,
          tabState: mergedPanelTabStates(defaultPanelTabState, tabState),
        },
      }));
    },
    [],
  );

  const setPanelTab = useCallback(
    (newTab: PanelTab, tabState?: Partial<PanelTabState>) => {
      segment.track(SEGMENT_KEYS.panel.tabChange, {
        newTab,
      });

      setPanelState((oldState) =>
        oldState.activePanelState
          ? {
              ...oldState,
              activePanelState: {
                ...oldState.activePanelState,
                tab: newTab,
                tabState: mergedPanelTabStates(
                  oldState.activePanelState.tabState,
                  tabState,
                ),
              },
            }
          : oldState,
      );
    },
    [],
  );

  const updateActivePanelTabState = useCallback(
    (tabState: Partial<PanelTabState>) => {
      setPanelState((oldState) =>
        oldState.activePanelState
          ? {
              ...oldState,
              activePanelState: {
                ...oldState.activePanelState,
                tabState: {
                  ...oldState.activePanelState.tabState,
                  ...tabState,
                },
              },
            }
          : oldState,
      );
    },
    [],
  );

  const navigateToPreviousPanelObject = useCallback(() => {
    segment.track(SEGMENT_KEYS.panel.historyPrevious);

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
    segment.track(SEGMENT_KEYS.panel.historyForward);

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
    segment.track(SEGMENT_KEYS.panel.closed);

    setPanelState({
      activePanelState: null,
      previousPanelStates: [],
      forwardPanelStates: [],
    });

    const cleanedQuery = urlQueryWithoutPanelQuery(query);

    replace({ ...cleanedQuery });
  }, [query, replace]);

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

  useEffect(() => {
    updatePanelUrlQuery(panelState.activePanelState);
  }, [panelState.activePanelState, updatePanelUrlQuery]);

  useEffect(() => console.log("query changed"), [query]);

  return {
    activePanelObject,
    activePanelTab: panelState.activePanelState?.tab || PanelTab.Metadata,
    activePanelTabState:
      panelState.activePanelState?.tabState || defaultPanelTabState,
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
    updateActivePanelTabState,
  };
};

export const useInitialPanelStateFromQuery = (
  isReadyToOpenPanel: boolean,
  setPanelObject?: (obj: SkylarkObjectIdentifier, tab?: PanelTab) => void,
) => {
  const { query } = useRouter();

  const [hasInitialQueryBeenUpdated, setInitialQueryUpdated] = useState(false);

  useEffect(() => {
    const currentPanelQuery = readPanelUrlQuery(query);

    if (
      isReadyToOpenPanel &&
      setPanelObject &&
      !hasInitialQueryBeenUpdated &&
      currentPanelQuery &&
      currentPanelQuery.panelUid &&
      currentPanelQuery.panelObjectType &&
      currentPanelQuery.panelLanguage
    ) {
      setInitialQueryUpdated(true);
      setPanelObject(
        {
          uid: currentPanelQuery.panelUid,
          objectType: currentPanelQuery.panelObjectType,
          language: currentPanelQuery.panelLanguage,
        },
        currentPanelQuery.panelTab as PanelTab | undefined,
      );
    }
  }, [hasInitialQueryBeenUpdated, isReadyToOpenPanel, query, setPanelObject]);
};
