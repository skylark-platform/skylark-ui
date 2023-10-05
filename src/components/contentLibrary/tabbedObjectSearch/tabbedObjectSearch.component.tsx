import clsx from "clsx";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
import {
  FiCheckSquare,
  FiCrosshair,
  FiEdit,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiXSquare,
} from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";

import { AvailabilitySummary } from "src/components/availability";
import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { TextInput } from "src/components/inputs/textInput";
import {
  MemoizedObjectSearch,
  ObjectSearchProps,
} from "src/components/objectSearch";
import { CreateButtons } from "src/components/objectSearch/createButtons";
import { OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS } from "src/components/objectSearch/results/columnConfiguration";
import { ScrollableTabs } from "src/components/tabs/tabs.component";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import {
  ObjectSearchTab,
  useObjectSearchTabs,
} from "src/hooks/localStorage/useObjectSearchTabs";
import { SearchFilters } from "src/hooks/useSearch";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import { useUserAccount } from "src/hooks/useUserAccount";
import {
  BuiltInSkylarkObjectType,
  SkylarkAvailabilityField,
  SkylarkSystemField,
} from "src/interfaces/skylark";

type TabbedObjectSearchProps = Omit<
  ObjectSearchProps,
  | "initialFilters"
  | "initialColumnState"
  | "onFilterChange"
  | "onColumnStateChange"
> & { accountId: string };

const generateNewTab = (
  name: string,
  {
    id,
    filters,
    columnsState,
    searchType,
  }: Partial<Omit<ObjectSearchTab, "name" | "filters">> & {
    filters?: Partial<SearchFilters>;
  },
): ObjectSearchTab => ({
  id: id || uuidv4(),
  name,
  searchType: searchType || SearchType.Search,
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
  generateNewTab("Default View", { id: "DEFAULT_VIEW" }),
  generateNewTab("Availability", {
    id: "DEFAULT_VIEW_AVAILABILITY",
    filters: {
      objectTypes: [BuiltInSkylarkObjectType.Availability],
      language: null,
    },
    columnsState: {
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
  }),
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
                  <FiCheckSquare className="text-lg" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-error"
                  aria-label="cancel tab rename"
                  onClick={() => {
                    setUpdatedName(null);
                  }}
                >
                  <FiXSquare className="text-lg" />
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
                  <FiEdit className="text-lg" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-manatee-400 hover:text-error"
                  onClick={onTabDelete}
                  aria-label="Delete active tab"
                >
                  <FiTrash2 className="text-lg" />
                </Button>
              </>
            )}
          </div>
          <AvailabilitySummary
            {...tab.filters}
            searchType={tab.searchType || SearchType.Search}
          />
        </>
      )}
    </div>
  );
};

const NewTabButton = ({
  tabs,
  setTabs,
  setActiveTabIndex,
}: {
  tabs: ObjectSearchTab[];
  setTabs: Dispatch<SetStateAction<ObjectSearchTab[] | undefined>>;
  setActiveTabIndex: Dispatch<SetStateAction<number>>;
}) => {
  const beforeSeparatorClassname =
    "before:absolute before:left-0 before:h-6 before:w-px before:bg-manatee-200 before:content-['']";

  const addTab = (argTab?: Partial<ObjectSearchTab>) => {
    setTabs((existingTabs) => {
      const tabsNum = existingTabs ? existingTabs.length + 1 : 1;

      const newTab = generateNewTab(
        argTab?.name?.replace("{tabNum}", `${tabsNum}`) || `View ${tabsNum}`,
        argTab || {},
      );

      const updatedTabs = existingTabs ? [...existingTabs, newTab] : [newTab];

      console.log({ updatedTabs });

      return updatedTabs;
    });
    setActiveTabIndex(tabs.length);
  };

  const newTabOptions = [
    {
      id: "blank-search-tab",
      text: "Search",
      Icon: <FiSearch className="text-lg" />,
      onClick: () =>
        addTab({
          name: `Search {tabNum}`,
        }),
    },
    {
      id: "blank-uid-extid-tab",
      text: "UID & External ID Lookup",
      Icon: <FiCrosshair className="text-lg" />,
      onClick: () =>
        addTab({
          name: `Lookup {tabNum}`,
          searchType: SearchType.UIDExtIDLookup,
        }),
    },
  ];

  return (
    <DropdownMenu
      options={newTabOptions}
      placement="bottom-start"
      renderInPortal
    >
      <DropdownMenuButton
        className={clsx(
          "relative flex h-full items-center justify-start whitespace-nowrap rounded rounded-b-none border-b border-b-transparent px-2 font-medium text-gray-400 hover:bg-manatee-50 hover:text-black md:pb-3 md:pt-2",
          beforeSeparatorClassname,
        )}
        aria-label="add tab"
      >
        <FiPlus className="h-4 w-4" />
      </DropdownMenuButton>
    </DropdownMenu>
  );
};

const TabbedObjectSearch = ({
  accountId,
  ...props
}: TabbedObjectSearchProps) => {
  const {
    tabs,
    activeTab,
    initialTabsScrollPosition,
    setTabs,
    modifyActiveTab,
    setActiveTabIndex,
    deleteActiveTab,
    changeActiveTabIndex,
    saveScrollPosition,
  } = useObjectSearchTabs(accountId, initialTabs);

  return (
    <>
      {tabs && (
        <div className="flex h-full max-h-full w-full flex-col">
          <div className="w-full pt-2 md:px-6 md:pt-4 lg:px-10">
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
                  onChange={({ index }) => changeActiveTabIndex(index)}
                  onScroll={({ scrollLeft: tabsScrollPosition }) =>
                    saveScrollPosition(tabsScrollPosition)
                  }
                  onDelete={() => deleteActiveTab()}
                />
                <NewTabButton
                  setActiveTabIndex={setActiveTabIndex}
                  tabs={tabs}
                  setTabs={setTabs}
                />
              </div>
              <CreateButtons
                className={clsx("mb-1 justify-end pr-1 md:pr-0")}
                onObjectCreated={(obj) => {
                  props.setPanelObject?.(obj);
                }}
                preselectedObjectType={
                  activeTab?.filters.objectTypes?.length === 1
                    ? activeTab.filters.objectTypes[0]
                    : undefined
                }
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
              onTabRename={(name) => modifyActiveTab({ name })}
              onTabDelete={deleteActiveTab}
            />
          </div>
          <div className="relative flex w-full grow overflow-hidden pl-2 pt-1 md:pl-6 md:pt-2 lg:pl-10">
            <MemoizedObjectSearch
              key={`${accountId}-${activeTab?.id || -1}`}
              {...props}
              initialSearchType={activeTab?.searchType || SearchType.Search}
              initialFilters={activeTab?.filters}
              initialColumnState={activeTab?.columnsState}
              onStateChange={({ columns: columnsState, ...state }) =>
                modifyActiveTab({ ...state, columnsState })
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export const TabbedObjectSearchWithAccount = (
  props: Omit<TabbedObjectSearchProps, "accountId">,
) => {
  const [creds] = useSkylarkCreds();
  const { accountId, isLoading: isAccountLoading } = useUserAccount();

  return (
    <>
      {accountId && !isAccountLoading && (
        <TabbedObjectSearch
          key={`${creds?.uri}-${accountId}`}
          accountId={accountId}
          {...props}
        />
      )}
      {!accountId && !isAccountLoading && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-base">
          <p className="text-3xl font-semibold">Something went wrong...</p>
          <p>We are having trouble accessing your Skylark Account ID.</p>
          <p>Please contact our Customer Success team.</p>
        </div>
      )}
    </>
  );
};
