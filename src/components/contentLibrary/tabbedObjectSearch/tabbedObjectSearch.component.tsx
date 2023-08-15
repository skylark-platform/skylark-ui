import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";

import { Button } from "src/components/button";
import {
  CheckSquare,
  CrossCircle,
  CrossSquare,
  Edit,
  Plus,
} from "src/components/icons";
import { TextInput } from "src/components/inputs/textInput";
import {
  MemoizedObjectSearch,
  ObjectSearchProps,
} from "src/components/objectSearch";
import { CreateButtons } from "src/components/objectSearch/createButtons";
import { Tabs } from "src/components/tabs/tabs.component";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { SearchFilters } from "src/hooks/useSearch";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { formatReadableDate } from "src/lib/skylark/availability";

interface Tab {
  name?: string;
  filters: SearchFilters;
}

const saveTabStateToStorage = (tabs: Tab[]) => {
  localStorage.setItem(LOCAL_STORAGE.contentLibraryTabs, JSON.stringify(tabs));
};

const readTabStateFromStorage = () => {
  const tabStateFromStorage = localStorage.getItem(
    LOCAL_STORAGE.contentLibraryTabs,
  );

  if (!tabStateFromStorage) {
    return null;
  }

  try {
    return JSON.parse(tabStateFromStorage) as Tab[];
  } catch (err) {
    return null;
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

  // const languageStr = language ? `in "${language}"` : "";
  const translationStr = language ? (
    <>
      translated to <strong>{language}</strong>{" "}
    </>
  ) : (
    <></>
  );

  const queryStr = query ? (
    <>
      filtered by <strong>{query}</strong>{" "}
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

    const renderedTimeTravel = timeTravel ? (
      <>
        at <strong>{formatReadableDate(timeTravel)}</strong>
      </>
    ) : (
      <></>
    );

    availabilityStr =
      renderedDimensions && renderedTimeTravel ? (
        <>
          available {renderedDimensions} {renderedTimeTravel}{" "}
        </>
      ) : (
        <>available {renderedDimensions || renderedTimeTravel} </>
      );
  }

  return (
    <p
      className={clsx(
        "text-sm text-manatee-500",
        "[&>strong]:font-medium [&>strong]:text-black",
        "after:-ml-0.5 after:content-['.']",
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

const generateNewTab = (name: string): Tab => ({
  name,
  filters: {
    query: "",
    objectTypes: null,
    availability: {
      dimensions: null,
      timeTravel: null,
    },
  },
});

const Tab = ({
  active,
  name,
  onClick,
}: {
  active?: boolean;
  name?: string;
  onClick: () => void;
}) => {
  return (
    <div className={clsx("group relative", active && "z-10")}>
      <button
        className={clsx(
          "group flex w-20 min-w-32 items-center justify-start rounded rounded-b-none border px-2 pr-1",
          active
            ? "h-9 border-b-transparent bg-manatee-50 text-black shadow-sm"
            : "h-8 bg-manatee-200 text-manatee-600 transition-colors group-hover:bg-manatee-300 group-hover:text-black",
        )}
        onClick={onClick}
      >
        {name || `Tab 1`}
      </button>
      <div className="absolute bottom-0 right-2 top-0 hidden items-center pl-1 group-hover:flex">
        <Button
          variant="ghost"
          className="group/circle text-manatee-700 hover:text-black"
        >
          <CrossCircle className="h-5 w-5 rounded-full bg-manatee-300 transition-colors group-hover/circle:bg-manatee-400" />
        </Button>
      </div>
    </div>
  );
};

const TabOverview = ({
  className,
  tab,
  onTabRename,
}: {
  className?: string;
  tab: Tab | null;
  onTabRename: (name: string) => void;
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
  const [activeTabIndex, setActiveTab] = useState(0);

  const [tabs, setTabs] = useState<Tab[] | undefined>(undefined);

  useEffect(() => {
    const tabsFromStorage = readTabStateFromStorage();

    setTabs(
      tabsFromStorage && tabsFromStorage.length > 0
        ? tabsFromStorage
        : [generateNewTab("Default view")],
    );
  }, []);

  const activeTab = tabs?.[activeTabIndex];

  const onActiveTabChange = (updatedTab: Partial<Tab>) => {
    const updatedTabs = tabs?.map((tab, index) => {
      if (index !== activeTabIndex) return tab;

      return {
        ...tab,
        ...updatedTab,
      };
    });

    saveTabStateToStorage(updatedTabs || []);
    setTabs(updatedTabs || []);
  };

  return (
    <>
      {tabs && (
        <div className="flex h-full max-h-full w-full flex-col">
          <div className="ml-2 mr-10 flex items-end justify-between space-x-px border-b border-b-manatee-50 pt-2 text-sm md:ml-6 md:pt-6 lg:ml-10">
            {/* {tabs.map(({ name, filters }, i) => (
              <Tab
                key={i}
                name={name || `Search ${i + 1}`}
                active={activeTabIndex === i}
                onClick={() => setActiveTab(i)}
              />
            ))} */}
            <div className="scrollbar-hidden overflow-scroll">
              <Tabs
                tabs={tabs.map((tab, i) => tab?.name || `Search ${i + 1}`)}
                selectedTab={activeTab?.name || `Search ${activeTabIndex + 1}`}
                onChange={({ index }) => setActiveTab(index)}
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
                setActiveTab(tabs.length);
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
          <div className="relative flex w-full grow overflow-hidden pl-2 pt-2 md:pl-6 md:pt-6 lg:pl-10">
            <MemoizedObjectSearch
              key={activeTabIndex}
              {...props}
              initialFilters={activeTab?.filters}
              onFilterChange={(filters) => onActiveTabChange({ filters })}
            />
          </div>
        </div>
      )}
    </>
  );
};
