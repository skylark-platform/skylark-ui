import clsx from "clsx";
import { useEffect, useState } from "react";

import { Button } from "src/components/button";
import { CrossCircle, Plus } from "src/components/icons";
import {
  MemoizedObjectSearch,
  ObjectSearchProps,
} from "src/components/objectSearch";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SearchFilters } from "src/hooks/useSearch";

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

const generateTabName = (filters: SearchFilters) => {
  if (filters.objectTypes?.length === 1) {
    return `"${filters.objectTypes[0]}"`;
  }
};

const blankTab: Tab = {
  filters: {
    query: "",
    objectTypes: null,
    availability: {
      dimensions: null,
      timeTravel: null,
    },
  },
};

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

export const TabbedObjectSearch = (props: ObjectSearchProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const [tabs, setTabs] = useState<Tab[] | undefined>(undefined);

  useEffect(() => {
    const tabsFromStorage = readTabStateFromStorage();

    setTabs(
      tabsFromStorage && tabsFromStorage.length > 0
        ? tabsFromStorage
        : [blankTab],
    );
  }, []);

  const activeFilters = tabs?.[activeTab]?.filters;

  const onFilterChange = (filters: SearchFilters) => {
    const updatedTabs = tabs?.map((tab, index) => {
      if (index !== activeTab) return tab;

      return {
        ...tab,
        filters,
      };
    });

    saveTabStateToStorage(updatedTabs || []);
    setTabs(updatedTabs || []);
  };

  return (
    <>
      {tabs && (
        <div className="flex h-full max-h-full w-full flex-col">
          <div className="flex items-end space-x-px border-b border-b-manatee-50 pl-2 pt-2 text-sm md:pl-6 md:pt-4 lg:pl-10">
            {tabs.map(({ name, filters }, i) => (
              <Tab
                key={i}
                name={name || `Search ${i + 1}`}
                active={activeTab === i}
                onClick={() => setActiveTab(i)}
              />
            ))}
            <button
              className="flex h-8 w-8 items-center justify-start rounded rounded-b-none border bg-manatee-200 px-2"
              onClick={() =>
                setTabs((existingTabs) =>
                  existingTabs ? [...existingTabs, blankTab] : [blankTab],
                )
              }
            >
              <Plus />
            </button>
          </div>
          <div className="relative flex w-full grow overflow-hidden pl-2 pt-2 md:pl-6 md:pt-4 lg:pl-10">
            <MemoizedObjectSearch
              key={activeTab}
              {...props}
              initialFilters={activeFilters}
              onFilterChange={onFilterChange}
            />
          </div>
        </div>
      )}
    </>
  );
};
