import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { useState, useCallback, useMemo, useEffect } from "react";

import { SEGMENT_KEYS } from "src/constants/segment";
import {
  ParsedSkylarkObject,
  ParsedSkylarkObjectAvailabilityObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { segment } from "src/lib/analytics/segment";
import { isObjectsDeepEqual } from "src/lib/utils";

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

export interface PanelState {
  tab: PanelTab;
  tabState: PanelTabState;
  object: SkylarkObjectIdentifier;
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

export type SetPanelObject = (
  newPanelObject: SkylarkObjectIdentifier,
  opts?: {
    tab?: PanelTab;
    tabState?: Partial<PanelTabState>;
    keepTab?: boolean;
    parsedObject?: ParsedSkylarkObject;
  },
  analyticsOpts?: {
    source: "panel" | "contentLibrary";
  },
) => void;

const createPanelUrlQuery = (state: Partial<PanelState>) => {
  const { object, tab } = state;

  const obj: PanelUrlQuery = {};

  if (object) {
    if (object.uid) {
      obj.panelUid = object.uid;
    }

    if (object.objectType) {
      obj.panelObjectType = object.objectType;
    }

    if (object.language) {
      obj.panelLanguage = object.language;
    }

    if (Object.keys(object).length === 0) {
      return null;
    }

    if (tab) {
      obj.panelTab = tab;
    }
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

export const usePanelObjectState = (initialPanelState?: PanelState) => {
  const { replace, query } = useRouter();

  const updatePanelUrlQuery = useCallback(
    (newPanelState: PanelState | null) => {
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
    activePanelState: PanelState | null;
    previousPanelStates: PanelState[];
    forwardPanelStates: PanelState[];
  }>({
    activePanelState: initialPanelState || null,
    previousPanelStates: [],
    forwardPanelStates: [],
  });

  const setPanelObject: SetPanelObject = useCallback(
    (newPanelObject, opts, analyticsOpts) => {
      const { tab, tabState, keepTab } = opts || {
        tab: undefined,
        tabState: undefined,
        keepTab: undefined,
      };

      segment.track(SEGMENT_KEYS.panel.objectChange, {
        newPanelObject,
        tab,
        tabState,
        source: analyticsOpts?.source || "unknown",
      });

      setPanelState((oldState) => {
        const updatedTab =
          tab ||
          (keepTab && oldState.activePanelState?.tab) ||
          PanelTab.Metadata;

        const updatedState = {
          forwardPanelStates: [],
          previousPanelStates: oldState.activePanelState
            ? [...oldState.previousPanelStates, oldState.activePanelState]
            : oldState.previousPanelStates,
          activePanelState: {
            object: newPanelObject,
            tab: updatedTab,
            tabState: mergedPanelTabStates(defaultPanelTabState, tabState),
          },
        };

        updatePanelUrlQuery(updatedState.activePanelState);

        return updatedState;
      });
    },
    [updatePanelUrlQuery],
  );

  const setPanelTab = useCallback(
    (newTab: PanelTab, tabState?: Partial<PanelTabState>) => {
      segment.track(SEGMENT_KEYS.panel.tabChange, {
        newTab,
      });

      setPanelState((oldState) => {
        const updatedState = oldState.activePanelState
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
          : oldState;

        updatePanelUrlQuery(updatedState.activePanelState);

        return updatedState;
      });
    },
    [updatePanelUrlQuery],
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

    setPanelState((oldState) => {
      const updatedState =
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
          : oldState;

      updatePanelUrlQuery(updatedState.activePanelState);

      return updatedState;
    });
  }, [updatePanelUrlQuery]);

  const navigateToForwardPanelObject = useCallback(() => {
    segment.track(SEGMENT_KEYS.panel.historyForward);

    setPanelState((oldState) => {
      const updatedState = {
        previousPanelStates: oldState.activePanelState
          ? [...oldState.previousPanelStates, oldState.activePanelState]
          : oldState.previousPanelStates,
        forwardPanelStates: oldState.forwardPanelStates.slice(0, -1),
        activePanelState:
          oldState.forwardPanelStates[oldState.forwardPanelStates.length - 1],
      };

      updatePanelUrlQuery(updatedState.activePanelState);

      return updatedState;
    });
  }, [updatePanelUrlQuery]);

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
    (): SkylarkObjectIdentifier | null =>
      panelState.activePanelState?.object.uid === undefined ||
      panelState.activePanelState?.object.objectType === undefined ||
      panelState.activePanelState?.object.language === undefined
        ? null
        : panelState.activePanelState.object,
    [panelState.activePanelState?.object],
  );

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
  setPanelObject?: SetPanelObject,
) => {
  const { query, isReady } = useRouter();

  const [hasInitialQueryBeenUpdated, setInitialQueryUpdated] = useState(false);

  useEffect(() => {
    if (
      isReadyToOpenPanel &&
      setPanelObject &&
      !hasInitialQueryBeenUpdated &&
      isReady
    ) {
      const currentPanelQuery = readPanelUrlQuery(query);
      if (
        currentPanelQuery &&
        currentPanelQuery.panelUid &&
        currentPanelQuery.panelObjectType
      ) {
        setPanelObject(
          {
            uid: currentPanelQuery.panelUid,
            objectType: currentPanelQuery.panelObjectType,
            language: currentPanelQuery.panelLanguage || "",
            externalId: null,
            display: {
              name: currentPanelQuery.panelUid,
              objectType: currentPanelQuery.panelObjectType,
              colour: undefined,
            },
            availabilityStatus: null,
            availableLanguages: [],
            contextualFields: undefined,
            type: null,
            created: undefined,
            modified: undefined,
          },
          { tab: currentPanelQuery.panelTab as PanelTab | undefined },
        );
      }

      setInitialQueryUpdated(true);
    }
  }, [
    hasInitialQueryBeenUpdated,
    isReady,
    isReadyToOpenPanel,
    query,
    setPanelObject,
  ]);
};
