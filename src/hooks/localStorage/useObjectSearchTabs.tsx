import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { ObjectSearchInitialColumnsState } from "src/components/objectSearch";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SearchFilters } from "src/hooks/useSearch";
import { readIntFromLocalStorage } from "src/lib/utils";

export interface ObjectSearchTab {
  id: string;
  name?: string;
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

  const modifyActiveTab = useCallback(
    (updatedTab: Partial<ObjectSearchTab>) => {
      const updatedTabs =
        tabs?.map((tab, index) => {
          if (index !== activeTabIndex) return tab;

          return {
            ...tab,
            ...{
              ...updatedTab,
              columnsState: updatedTab.columnsState || tab.columnsState,
              filters: updatedTab.filters || tab.filters,
            },
          };
        }) || [];

      saveTabStateToStorage(accountId, { tabs: updatedTabs });
      setTabs(updatedTabs);
    },
    [accountId, activeTabIndex, setTabs, tabs],
  );

  const deleteActiveTab = useCallback(() => {
    if (tabs) {
      const updatedTabs = [...tabs];
      updatedTabs.splice(activeTabIndex, 1);

      if (updatedTabs.length === 0) {
        updatedTabs.push(...initialTabs);
      }

      saveTabStateToStorage(accountId, { tabs: updatedTabs });
      setTabs(updatedTabs);
      setActiveTabIndex(activeTabIndex > 0 ? activeTabIndex - 1 : 0);
    }
  }, [accountId, activeTabIndex, initialTabs, tabs]);

  const changeActiveTabIndex = (newIndex: number) => {
    if (accountId) {
      saveTabStateToStorage(accountId, { activeTabIndex: newIndex });
    }
    setActiveTabIndex(newIndex);
  };

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
    setActiveTabIndex,
    setTabs,
    saveScrollPosition,
    deleteActiveTab,
    modifyActiveTab,
    changeActiveTabIndex,
  };
};
