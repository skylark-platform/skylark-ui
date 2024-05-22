import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { ObjectSearchInitialColumnsState } from "src/components/objectSearch";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SEGMENT_KEYS } from "src/constants/segment";
import { SearchFilters } from "src/hooks/useSearch";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import { segment } from "src/lib/analytics/segment";
import { readIntFromLocalStorage } from "src/lib/utils";

export interface ObjectSearchTab {
  id: string;
  name: string;
  searchType: SearchType;
  filters: SearchFilters;
  columnsState?: ObjectSearchInitialColumnsState;
}

const saveTabStateToStorage = (
  accountId: string,
  {
    tabs,
    activeTabIndex,
    tabsScrollPosition,
  }: Partial<{
    tabs: ObjectSearchTab[];
    activeTabIndex: number;
    tabsScrollPosition: number;
  }>,
) => {
  if (accountId) {
    if (tabs !== undefined) {
      localStorage.setItem(
        LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary.tabState,
        JSON.stringify(tabs),
      );
    }

    if (activeTabIndex !== undefined) {
      localStorage.setItem(
        LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary.activeTabIndex,
        String(activeTabIndex),
      );
    }

    if (tabsScrollPosition !== undefined) {
      localStorage.setItem(
        LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary
          .tabsScrollPosition,
        String(tabsScrollPosition),
      );
    }
  }
};

const readTabsFromStorage = (accountId: string) => {
  const valueFromStorage = localStorage.getItem(
    LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary.tabState,
  );

  if (!valueFromStorage) {
    return null;
  }

  try {
    return JSON.parse(valueFromStorage) as ObjectSearchTab[];
  } catch (err) {
    return null;
  }
};

export const useObjectSearchTabs = (
  accountId: string,
  initialTabs: ObjectSearchTab[],
) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState<ObjectSearchTab[] | undefined>(undefined);
  const [initialTabsScrollPosition, setInitialTabsScrollPosition] = useState(0);

  useEffect(() => {
    const setValuesFromLocalStorage = () => {
      if (accountId) {
        const tabsFromStorage = readTabsFromStorage(accountId);
        const activeIndex = readIntFromLocalStorage(
          LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary
            .activeTabIndex,
        );
        const tabsScrollPosition = readIntFromLocalStorage(
          LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary
            .tabsScrollPosition,
        );

        setTabs(
          tabsFromStorage && tabsFromStorage.length > 0
            ? tabsFromStorage
            : initialTabs,
        );
        setActiveTabIndex(
          tabsFromStorage && activeIndex && activeIndex < tabsFromStorage.length
            ? activeIndex
            : 0,
        );
        setInitialTabsScrollPosition(tabsScrollPosition || 0);
      } else {
        setTabs(undefined);
        setActiveTabIndex(0);
        setInitialTabsScrollPosition(0);
      }
    };

    setValuesFromLocalStorage();

    window.addEventListener("storage", setValuesFromLocalStorage);
    return () => {
      window.removeEventListener("storage", setValuesFromLocalStorage);
    };
  }, [accountId, initialTabs]);

  const setTabsAndWriteToLocalStorage = useCallback(
    (tabs: ObjectSearchTab[]) => {
      segment.track(SEGMENT_KEYS.objectSearch.tabsModified, { tabs });

      setTabs(tabs);
      saveTabStateToStorage(accountId, { tabs });
    },
    [accountId],
  );

  const modifyActiveTab = useCallback(
    (updatedTab: Partial<ObjectSearchTab>) => {
      segment.track(SEGMENT_KEYS.objectSearch.activeTabModified, {
        updatedTab,
      });

      const updatedTabs =
        tabs?.map((tab, index) => {
          if (index !== activeTabIndex) return tab;

          return {
            ...tab,
            ...updatedTab,
            searchType: updatedTab.searchType || tab.searchType,
            columnsState: updatedTab.columnsState || tab.columnsState,
            filters: updatedTab.filters || tab.filters,
          };
        }) || [];

      setTabsAndWriteToLocalStorage(updatedTabs);
    },
    [activeTabIndex, setTabsAndWriteToLocalStorage, tabs],
  );

  const deleteTab = useCallback(
    (index: number) => {
      if (tabs) {
        const updatedTabs = [...tabs];
        updatedTabs.splice(index, 1);

        if (updatedTabs.length === 0) {
          updatedTabs.push(...initialTabs);
        }

        setTabsAndWriteToLocalStorage(updatedTabs);
        if (index <= activeTabIndex) {
          const newIndex = activeTabIndex === 0 ? 0 : activeTabIndex - 1;
          setActiveTabIndex(newIndex);
        }
      }
    },
    [activeTabIndex, initialTabs, setTabsAndWriteToLocalStorage, tabs],
  );

  const deleteActiveTab = useCallback(() => {
    deleteTab(activeTabIndex);
  }, [activeTabIndex, deleteTab]);

  const changeActiveTabIndex = useCallback((newIndex: number) => {
    if (accountId) {
      saveTabStateToStorage(accountId, { activeTabIndex: newIndex });
    }
    setActiveTabIndex(newIndex);
  }, []);

  const saveScrollPosition = useDebouncedCallback((position: number) => {
    saveTabStateToStorage(accountId, { tabsScrollPosition: position });
  }, 500);

  const activeTab = useMemo(
    () => tabs?.[activeTabIndex],
    [activeTabIndex, tabs],
  );

  return {
    activeTab,
    tabs,
    initialTabsScrollPosition,
    setActiveTabIndex: changeActiveTabIndex,
    setTabs: setTabsAndWriteToLocalStorage,
    saveScrollPosition,
    deleteActiveTab,
    deleteTab,
    modifyActiveTab,
  };
};
