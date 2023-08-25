import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { AvailabilitySummary } from "src/components/availability";
import { Button } from "src/components/button";
import {
  CheckSquare,
  CrossSquare,
  Edit,
  Plus,
  Trash,
} from "src/components/icons";
import { TextInput } from "src/components/inputs/textInput";
import {
  MemoizedObjectSearch,
  ObjectSearchInitialColumnsState,
  ObjectSearchProps,
} from "src/components/objectSearch";
import { CreateButtons } from "src/components/objectSearch/createButtons";
import { OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS } from "src/components/objectSearch/results/columnConfiguration";
import { ScrollableTabs } from "src/components/tabs/tabs.component";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useUser } from "src/contexts/useUser";
import { SearchFilters } from "src/hooks/useSearch";
import {
  BuiltInSkylarkObjectType,
  SkylarkAvailabilityField,
  SkylarkSystemField,
} from "src/interfaces/skylark";

export interface ObjectSearchTab {
  id: string;
  name?: string;
  filters: SearchFilters;
  columnsState?: ObjectSearchInitialColumnsState;
}

type TabbedObjectSearchProps = Omit<
  ObjectSearchProps,
  | "initialFilters"
  | "initialColumnState"
  | "onFilterChange"
  | "onColumnStateChange"
>;

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
};

const readTabStateFromStorage = (accountId: string) => {
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

const readIntFromLocalStorage = (name: string): number => {
  const valueFromStorage = localStorage.getItem(name);

  if (!valueFromStorage) {
    return 0;
  }

  try {
    return parseInt(valueFromStorage);
  } catch (err) {
    return 0;
  }
};

const generateNewTab = (
  name: string,
  id?: string,
  filters?: Partial<SearchFilters>,
  columnsState?: ObjectSearchInitialColumnsState,
): ObjectSearchTab => ({
  id: id || uuidv4(),
  name,
  filters: {
    query: "",
    objectTypes: null,
    availability: {
      dimensions: null,
      timeTravel: null,
    },
    ...filters,
  },
  columnsState,
});

const initialTabs = [
  generateNewTab("Default View", "DEFAULT_VIEW"),
  generateNewTab(
    "Availability",
    "DEFAULT_VIEW_AVAILABILITY",
    {
      objectTypes: [BuiltInSkylarkObjectType.Availability],
      language: null,
    },
    {
      columns: [
        ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
        OBJECT_LIST_TABLE.columnIds.displayField,
        OBJECT_LIST_TABLE.columnIds.availability,
        SkylarkAvailabilityField.Start,
        SkylarkAvailabilityField.End,
        SkylarkAvailabilityField.Timezone,
        SkylarkSystemField.ExternalID,
        SkylarkSystemField.UID,
        SkylarkAvailabilityField.Title,
        SkylarkSystemField.Slug,
      ],
      frozen: [
        ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
        OBJECT_LIST_TABLE.columnIds.displayField,
        OBJECT_LIST_TABLE.columnIds.availability,
      ],
    },
  ),
];

const TabOverview = ({
  className,
  tab,
  onTabRename,
  onTabDelete,
}: {
  className?: string;
  tab: ObjectSearchTab | null;
  onTabRename: (name: string) => void;
  onTabDelete: () => void;
}) => {
  const [updatedName, setUpdatedName] = useState<string | null>(null);

  return (
    <div className={className}>
      {tab && (
        <>
          <div className="flex items-center space-x-2">
            {updatedName !== null ? (
              <>
                <TextInput
                  onChange={setUpdatedName}
                  value={updatedName}
                  className="w-full text-sm md:w-80 md:text-base lg:w-96"
                  aria-label="tab name input"
                  onEnterKeyPress={() => {
                    if (updatedName.length > 0) {
                      onTabRename(updatedName);
                      setUpdatedName(null);
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  className="text-success"
                  aria-label="save tab rename"
                  disabled={updatedName.length === 0}
                  onClick={() => {
                    onTabRename(updatedName);
                    setUpdatedName(null);
                  }}
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-error"
                  aria-label="cancel tab rename"
                  onClick={() => {
                    setUpdatedName(null);
                  }}
                >
                  <CrossSquare className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">{tab.name}</h2>
                <Button
                  variant="ghost"
                  className="text-manatee-400 hover:text-black"
                  onClick={() => {
                    setUpdatedName(tab.name || "");
                  }}
                  aria-label="Rename active tab"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-manatee-400 hover:text-error"
                  onClick={onTabDelete}
                  aria-label="Delete active tab"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <AvailabilitySummary {...tab.filters} />
        </>
      )}
    </div>
  );
};

export const TabbedObjectSearch = (props: TabbedObjectSearchProps) => {
  const { accountId, isLoading: isAccountLoading } = useUser();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState<ObjectSearchTab[] | undefined>(undefined);
  const [initialTabsScrollPosition, setInitialTabsScrollPosition] = useState(0);

  useEffect(() => {
    if (accountId) {
      const tabsFromStorage = readTabStateFromStorage(accountId);
      const activeIndex = readIntFromLocalStorage(
        LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary.activeTabIndex,
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
  }, [accountId]);

  const activeTab = tabs?.[activeTabIndex];

  const onActiveTabChange = useCallback(
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

      if (accountId) {
        saveTabStateToStorage(accountId, { tabs: updatedTabs });
      }
      setTabs(updatedTabs);
    },
    [accountId, activeTabIndex, tabs],
  );

  const onActiveTabIndexChange = (newIndex: number) => {
    if (accountId) {
      saveTabStateToStorage(accountId, { activeTabIndex: newIndex });
    }
    setActiveTabIndex(newIndex);
  };

  const deleteActiveTab = () => {
    if (tabs) {
      const updatedTabs = [...tabs];
      updatedTabs.splice(activeTabIndex, 1);

      if (updatedTabs.length === 0) {
        updatedTabs.push(...initialTabs);
      }

      if (accountId) {
        saveTabStateToStorage(accountId, { tabs: updatedTabs });
      }
      setTabs(updatedTabs);
      setActiveTabIndex(activeTabIndex > 0 ? activeTabIndex - 1 : 0);
    }
  };

  const beforeSeparatorClassname =
    "before:absolute before:left-0 before:h-6 before:w-px before:bg-manatee-200 before:content-['']";

  return (
    <>
      {tabs && (
        <div className="flex h-full max-h-full w-full flex-col">
          <div className="w-full md:px-6 md:pt-4 lg:px-10">
            <div className="flex w-full justify-between space-x-0.5 sm:space-x-1 md:space-x-2 lg:space-x-4">
              <div
                data-testid="object-search-tabs"
                className="flex grow items-end space-x-px overflow-x-hidden border-b border-b-manatee-50 text-sm"
              >
                <ScrollableTabs
                  key={accountId}
                  initialScrollPosition={initialTabsScrollPosition}
                  tabs={tabs.map((tab, i) => ({
                    name: tab?.name || `View ${i + 1}`,
                    id: tab.id,
                  }))}
                  selectedTab={activeTab?.id || ""}
                  onChange={({ index }) => onActiveTabIndexChange(index)}
                  onScroll={({ scrollLeft: tabsScrollPosition }) =>
                    accountId &&
                    saveTabStateToStorage(accountId, { tabsScrollPosition })
                  }
                />
                <button
                  className={clsx(
                    "relative flex h-full items-center justify-start whitespace-nowrap rounded rounded-b-none border-b border-b-transparent px-2 pb-3 pt-2 font-medium text-gray-400 hover:bg-manatee-50 hover:text-black",
                    beforeSeparatorClassname,
                  )}
                  onClick={() => {
                    setTabs((existingTabs) => {
                      const newTab = generateNewTab(
                        `View ${existingTabs ? existingTabs.length + 1 : 1}`,
                      );
                      return existingTabs
                        ? [...existingTabs, newTab]
                        : [newTab];
                    });
                    setActiveTabIndex(tabs.length);
                  }}
                  aria-label="add tab"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <CreateButtons
                className={clsx(
                  "mb-1 justify-end",
                  // props.isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
                )}
                onObjectCreated={(obj) => {
                  props.setPanelObject?.(obj);
                }}
              />
            </div>
          </div>
          <div
            className="mb-2 mr-2 mt-4 flex justify-between md:mr-8"
            data-testid="object-search-tab-overview"
          >
            <TabOverview
              tab={activeTab || null}
              className="ml-2 md:ml-12 lg:ml-16"
              onTabRename={(name) => onActiveTabChange({ name })}
              onTabDelete={deleteActiveTab}
            />
            {/* <CreateButtons
              className={clsx(
                "mb-2 mt-2 justify-end md:mb-0",
                props.isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
              )}
              onObjectCreated={(obj) => {
                props.setPanelObject?.(obj);
              }}
            /> */}
          </div>
          <div className="relative flex w-full grow overflow-hidden pl-2 pt-1 md:pl-6 md:pt-2 lg:pl-10">
            <MemoizedObjectSearch
              key={activeTabIndex}
              {...props}
              initialFilters={activeTab?.filters}
              initialColumnState={activeTab?.columnsState}
              onStateChange={({ filters, columns: columnsState }) =>
                onActiveTabChange({ filters, columnsState })
              }
            />
          </div>
        </div>
      )}
      {!tabs && !accountId && !isAccountLoading && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-base">
          <p className="text-3xl font-semibold">Something went wrong...</p>
          <p>We are having trouble accessing your Skylark Account ID.</p>
          <p>Please contact our Customer Success team.</p>
        </div>
      )}
    </>
  );
};
