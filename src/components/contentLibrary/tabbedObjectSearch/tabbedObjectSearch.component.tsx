import clsx from "clsx";
import { ReactNode, useCallback, useEffect, useState } from "react";

import { Button } from "src/components/button";
import {
  CheckSquare,
  CrossCircle,
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
import { Tabs } from "src/components/tabs/tabs.component";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useUser } from "src/contexts/useUser";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { SearchFilters } from "src/hooks/useSearch";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  SkylarkAvailabilityField,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import {
  formatReadableDate,
  formatTimezone,
} from "src/lib/skylark/availability";

interface Tab {
  name?: string;
  filters: SearchFilters;
  columnsState?: ObjectSearchInitialColumnsState;
}

const saveTabStateToStorage = (
  accountId: string,
  { tabs, activeTabIndex }: Partial<{ tabs: Tab[]; activeTabIndex: number }>,
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
};

const readTabStateFromStorage = (accountId: string) => {
  const valueFromStorage = localStorage.getItem(
    LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary.tabState,
  );

  if (!valueFromStorage) {
    return null;
  }

  try {
    return JSON.parse(valueFromStorage) as Tab[];
  } catch (err) {
    return null;
  }
};

const readActiveTabIndexFromStorage = (accountId: string): number => {
  const valueFromStorage = localStorage.getItem(
    LOCAL_STORAGE.accountPrefixed(accountId).contentLibrary.activeTabIndex,
  );

  if (!valueFromStorage) {
    return 0;
  }

  try {
    return parseInt(valueFromStorage);
  } catch (err) {
    return 0;
  }
};

const prettifyStrArr = (arr: string[]): string => {
  if (arr.length === 0) {
    return "";
  }

  if (arr.length === 1) {
    return arr[0];
  }

  return `${arr.slice(0, arr.length - 1).join(", ")} & ${arr[arr.length - 1]}`;
};

const TabDescription = ({
  filters: {
    objectTypes,
    language,
    query,
    availability: { dimensions, timeTravel },
  },
}: {
  filters: SearchFilters;
}) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { dimensions: allDimensionsWithValues } =
    useAvailabilityDimensionsWithValues();

  let objectTypeStr = <>Objects </>;

  if (objectTypes) {
    const parsedObjectTypes = objectTypes.map((objectType) => {
      const objectTypeWithConfig = objectTypesWithConfig?.find(
        ({ objectType: name }) => name === objectType,
      );
      return objectTypeWithConfig?.config.objectTypeDisplayName || objectType;
    });

    objectTypeStr =
      objectTypes.length < 10 ? (
        <>
          <strong>{prettifyStrArr(parsedObjectTypes)}</strong> objects{" "}
        </>
      ) : (
        <>
          <strong>
            {objectTypesWithConfig?.length === objectTypes.length
              ? "All"
              : objectTypes.length}
          </strong>{" "}
          object types{" "}
        </>
      );
  }

  const translationStr = language ? (
    <>
      translated to <strong>{language}</strong>{" "}
    </>
  ) : (
    <></>
  );

  const queryStr = query ? (
    <>
      filtered by <strong>query &ldquo;{query}&rdquo;</strong>{" "}
    </>
  ) : (
    <></>
  );

  let availabilityStr = <></>;

  if (dimensions || timeTravel) {
    const strDimensions =
      dimensions &&
      Object.entries(dimensions).map(([dimension, value]) => {
        const foundDimension = allDimensionsWithValues?.find(
          (d) => dimension === d.slug,
        );
        const foundValue = foundDimension?.values.find((v) => value === v.slug);

        return foundValue?.title || value;
      });

    const renderedDimensions = strDimensions ? (
      <>
        to <strong>{prettifyStrArr(strDimensions)}</strong>
      </>
    ) : (
      <></>
    );

    console.log({ timeTravel });
    const renderedTimeTravel = timeTravel ? (
      <>
        on{" "}
        <strong>
          {formatReadableDate(timeTravel)} (
          {formatTimezone(timeTravel, "short")})
        </strong>
      </>
    ) : (
      <></>
    );

    availabilityStr =
      renderedDimensions && renderedTimeTravel ? (
        <>
          available {renderedDimensions} {renderedTimeTravel} users{" "}
        </>
      ) : (
        <>available {renderedDimensions || renderedTimeTravel} users </>
      );
  }

  return (
    <p
      className={clsx(
        "text-sm text-manatee-500",
        "[&>strong]:font-medium [&>strong]:text-black",
        "after:-ml-1 after:content-['.']",
      )}
    >
      {/* {[objectTypeStr, queryStr, availabilityStr, translationStr].filter(
        (str) => !!str,
      )} */}
      {objectTypeStr}
      {queryStr}
      {availabilityStr}
      {translationStr}
    </p>
  );

  // `"Episode" filtered by "search query"`
  // `"Episode, Movie, Season" found for "search query"`
  // "5 Object types" in "en-GB" filtered by "search query"
  // "5 Object types" in "en-GB" filtered by "search query" available to "Premium, PC"
  // "5 Object types" in "en-GB" filtered by "search query" available to "Premium, PC" at "27th August 2020"
};

const generateNewTab = (
  name: string,
  filters?: Partial<SearchFilters>,
  columnsState?: ObjectSearchInitialColumnsState,
): Tab => ({
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
  generateNewTab("Default View"),
  generateNewTab(
    "Availability",
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
  tab: Tab | null;
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
                  className="text-sm md:w-80 md:text-base lg:w-96"
                />
                <Button
                  variant="ghost"
                  className="text-success"
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
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-manatee-400 hover:text-error"
                  onClick={onTabDelete}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <TabDescription filters={tab.filters} />
        </>
      )}
    </div>
  );
};

export const TabbedObjectSearch = (props: ObjectSearchProps) => {
  const { accountId } = useUser();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState<Tab[] | undefined>(undefined);

  useEffect(() => {
    if (accountId) {
      const tabsFromStorage = readTabStateFromStorage(accountId);
      const activeIndex = readActiveTabIndexFromStorage(accountId);

      setTabs(
        tabsFromStorage && tabsFromStorage.length > 0
          ? tabsFromStorage
          : initialTabs,
      );
      setActiveTabIndex(activeIndex || 0);
    } else {
      setTabs(undefined);
      setActiveTabIndex(0);
    }
  }, [accountId]);

  const activeTab = tabs?.[activeTabIndex];

  const onActiveTabChange = useCallback(
    (updatedTab: Partial<Tab>) => {
      const updatedTabs =
        tabs?.map((tab, index) => {
          if (index !== activeTabIndex) return tab;

          return {
            ...tab,
            ...updatedTab,
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

  return (
    <>
      {tabs && (
        <div className="flex h-full max-h-full w-full flex-col">
          <div className="ml-2 mr-10 flex items-end justify-between space-x-px border-b border-b-manatee-50 pt-2 text-sm md:ml-6 md:pt-6 lg:ml-10">
            <div className="scrollbar-hidden overflow-scroll">
              <Tabs
                tabs={tabs.map((tab, i) => tab?.name || `Search ${i + 1}`)}
                selectedTab={activeTab?.name || `Search ${activeTabIndex + 1}`}
                onChange={({ index }) => onActiveTabIndexChange(index)}
              />
            </div>
            <button
              className="flex items-center justify-start whitespace-nowrap rounded rounded-b-none px-2 pb-3 pt-2 font-medium text-gray-400 hover:bg-manatee-50 hover:text-black"
              onClick={() => {
                setTabs((existingTabs) => {
                  const newTab = generateNewTab(
                    `View ${existingTabs ? existingTabs.length + 1 : 1}`,
                  );
                  return existingTabs ? [...existingTabs, newTab] : [newTab];
                });
                setActiveTabIndex(tabs.length);
              }}
            >
              <Plus className="mr-2 h-3 w-3" />
              <span>Add view</span>
            </button>
          </div>
          <div className="mb-2 mr-8 mt-4 flex justify-between">
            <TabOverview
              tab={activeTab || null}
              className="ml-16"
              onTabRename={(name) => onActiveTabChange({ name })}
              onTabDelete={deleteActiveTab}
            />
            <CreateButtons
              className={clsx(
                "mb-2 mt-2 justify-end md:mb-0",
                props.isPanelOpen ? "pr-2 lg:w-auto lg:pr-4" : "md:w-auto",
              )}
              onObjectCreated={(obj) => {
                props.setPanelObject?.(obj);
              }}
            />
          </div>
          <div className="relative flex w-full grow overflow-hidden pl-2 pt-1 md:pl-6 md:pt-2 lg:pl-10">
            <MemoizedObjectSearch
              key={activeTabIndex}
              {...props}
              initialFilters={activeTab?.filters}
              initialColumnState={activeTab?.columnsState}
              onFilterChange={(filters) => onActiveTabChange({ filters })}
              onColumnStateChange={(columnsState) =>
                onActiveTabChange({ columnsState })
              }
            />
          </div>
        </div>
      )}
    </>
  );
};
