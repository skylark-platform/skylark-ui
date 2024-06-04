import clsx from "clsx";
import { m } from "framer-motion";
import { useState } from "react";
import {
  FiCheckSquare,
  FiCrosshair,
  FiEdit,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiXSquare,
} from "react-icons/fi";
import { useIsClient } from "usehooks-ts";
import { v4 as uuidv4 } from "uuid";

import { AnimatedLogo } from "src/components/animatedLogo/animatedLogo.component";
import { AvailabilitySummary } from "src/components/availability";
import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuSection,
} from "src/components/dropdown/dropdown.component";
import { TextInput } from "src/components/inputs/input";
import {
  MemoizedObjectSearch,
  ObjectSearchInitialColumnsState,
  ObjectSearchProps,
} from "src/components/objectSearch";
import { CreateButtons } from "src/components/objectSearch/createButtons";
import { OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS } from "src/components/objectSearch/results/columnConfiguration";
import { ScrollableTabs } from "src/components/tabs/tabs.component";
import { SEGMENT_KEYS } from "src/constants/segment";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import {
  ObjectSearchTab,
  useObjectSearchTabs,
} from "src/hooks/localStorage/useObjectSearchTabs";
import { useInitialPanelStateFromQuery } from "src/hooks/state";
import { SearchFilters } from "src/hooks/useSearch";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { useUserAccount } from "src/hooks/useUserAccount";
import {
  BuiltInSkylarkObjectType,
  SkylarkAvailabilityField,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { segment } from "src/lib/analytics/segment";
import { splitMetadataIntoSystemTranslatableGlobal } from "src/lib/skylark/objects";

type TabbedObjectSearchProps = Omit<
  ObjectSearchProps,
  | "initialFilters"
  | "initialColumnState"
  | "onFilterChange"
  | "onColumnStateChange"
> & {
  accountId: string;
  skipLogoAnimation?: boolean;
  animate: object;
  initial: object;
};

const generateNewTabColumnStateForObjectType = (
  objectType: string,
  fields: string[],
): ObjectSearchInitialColumnsState => {
  if (objectType === BuiltInSkylarkObjectType.Availability) {
    return {
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
    };
  }

  const columnState = {
    columns: [
      ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
      OBJECT_LIST_TABLE.columnIds.displayField,
      OBJECT_LIST_TABLE.columnIds.translation,
      OBJECT_LIST_TABLE.columnIds.images,
      OBJECT_LIST_TABLE.columnIds.availability,
      ...fields,
    ].filter((str, index, arr) => arr.indexOf(str) === index),
    frozen: [
      ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
      OBJECT_LIST_TABLE.columnIds.displayField,
    ],
  };

  return columnState;
};

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
    columnsState: generateNewTabColumnStateForObjectType(
      BuiltInSkylarkObjectType.Availability,
      [],
    ),
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
  setTabs: (tabs: ObjectSearchTab[]) => void;
  setActiveTabIndex: (n: number) => void;
}) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();
  const { objects: objectsMeta } = useAllObjectsMeta();

  const beforeSeparatorClassname =
    "before:absolute before:left-0 before:h-6 before:w-px before:bg-manatee-200 before:content-['']";

  const addTab = (argTab?: Partial<ObjectSearchTab>) => {
    const tabsNum = tabs ? tabs.length + 1 : 1;

    const newTab = generateNewTab(
      argTab?.name?.replace("{tabNum}", `${tabsNum}`) || `View ${tabsNum}`,
      argTab || {},
    );

    segment.track(SEGMENT_KEYS.objectSearch.tabCreated, { newTab });

    const updatedTabs = tabs ? [...tabs, newTab] : [newTab];

    setTabs(updatedTabs);
    setActiveTabIndex(tabs.length);
  };

  const newTabOptions: DropdownMenuSection[] = [
    {
      id: "blank-options",
      options: [
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
      ],
    },
    {
      id: "search-object-type-options",
      label: "Search Object Types",
      options:
        objectTypesWithConfig?.map(({ objectType, config }) => {
          const readableObjType = `${
            config.objectTypeDisplayName || objectType
          }`;

          const onClick = () => {
            const objectMeta = objectsMeta?.find(
              ({ name }) => name === objectType,
            );
            const objectFields =
              objectMeta?.fields.map(({ name }) => name) || [];

            const splitFields =
              objectMeta &&
              splitMetadataIntoSystemTranslatableGlobal(
                objectFields,
                objectMeta?.fields,
                objectMeta?.fieldConfig,
                config.fieldConfig,
              );

            const fields = splitFields
              ? [
                  ...splitFields.systemMetadataFields,
                  ...splitFields.translatableMetadataFields,
                  ...splitFields.globalMetadataFields,
                ].map(({ field }) => field)
              : objectFields;

            addTab(
              generateNewTab(`${readableObjType} objects`, {
                filters: {
                  objectTypes: [objectType],
                  language:
                    objectType === BuiltInSkylarkObjectType.Availability
                      ? null
                      : undefined,
                },
                columnsState: generateNewTabColumnStateForObjectType(
                  objectType,
                  fields,
                ),
              }),
            );
          };

          return {
            id: `search-${objectType}`,
            text: readableObjType,
            Icon: <FiSearch className="text-lg" />,
            onClick,
          };
        }) || [],
    },
    {
      id: "other",
      label: "Other",
      options: [
        {
          id: `search-skylark-objects`,
          text: `Skylark objects`,
          Icon: <FiSearch className="text-lg" />,
          onClick: () =>
            addTab(
              generateNewTab(`Skylark objects`, {
                filters: {
                  objectTypes:
                    objectTypesWithConfig
                      ?.filter(({ objectType }) =>
                        objectType.toUpperCase().startsWith("SKYLARK"),
                      )
                      .map(({ objectType }) => objectType) || [],
                },
              }),
            ),
        },
        {
          id: `search-custom-objects`,
          text: `Custom objects`,
          Icon: <FiSearch className="text-lg" />,
          onClick: () =>
            addTab(
              generateNewTab(`Custom objects`, {
                filters: {
                  objectTypes:
                    objectTypesWithConfig
                      ?.filter(
                        ({ objectType }) =>
                          !objectType.toUpperCase().startsWith("SKYLARK"),
                      )
                      .map(({ objectType }) => objectType) || [],
                },
              }),
            ),
        },
      ],
    },
  ];

  return (
    <DropdownMenu options={newTabOptions} placement="bottom" renderInPortal>
      <DropdownMenuButton
        className={clsx(
          "relative flex h-full items-center justify-start whitespace-nowrap rounded rounded-b-none border-b border-b-transparent px-2 py-2 font-medium text-gray-400 hover:bg-manatee-50 hover:text-black md:pb-3 md:pt-2",
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
  initial,
  animate,
  setPanelObject,
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
    deleteTab,
    saveScrollPosition,
  } = useObjectSearchTabs(accountId, initialTabs);

  return (
    <>
      {tabs && (
        <m.div
          initial={initial}
          animate={animate}
          className="flex h-full max-h-full w-full flex-col"
        >
          <div className="w-full pt-2 md:px-6 md:pt-4 lg:px-10">
            <div className="flex w-full justify-between space-x-0.5 sm:space-x-1 md:space-x-2 lg:space-x-4">
              <div
                data-testid="object-search-tabs"
                className="flex grow items-end space-x-px overflow-x-hidden border-b border-b-manatee-50 text-sm"
              >
                <ScrollableTabs
                  key={accountId}
                  initialScrollPosition={initialTabsScrollPosition}
                  tabs={tabs}
                  selectedTab={activeTab?.id || ""}
                  onChange={({ index }) => setActiveTabIndex(index)}
                  onScroll={({ scrollLeft: tabsScrollPosition }) =>
                    saveScrollPosition(tabsScrollPosition)
                  }
                  onDelete={(tab) => deleteTab(tab.index)}
                  onReorder={(tabs) => {
                    setTabs(tabs as ObjectSearchTab[]);
                    const updatedTabIndex = tabs.findIndex(
                      (tab) => activeTab?.id === tab.id,
                    );
                    setActiveTabIndex(updatedTabIndex || 0);
                  }}
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
                  setPanelObject?.(obj);
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
              setPanelObject={setPanelObject}
              initialSearchType={activeTab?.searchType || SearchType.Search}
              initialFilters={activeTab?.filters}
              initialColumnState={activeTab?.columnsState}
              onStateChange={({ columns: columnsState, ...state }) =>
                modifyActiveTab({ ...state, columnsState })
              }
            />
          </div>
        </m.div>
      )}
    </>
  );
};

export const TabbedObjectSearchWithAccount = ({
  skipLogoAnimation,
  ...props
}: Omit<TabbedObjectSearchProps, "accountId" | "animate" | "initial">) => {
  const [creds] = useSkylarkCreds();
  const { accountId, isLoading: isAccountLoading } = useUserAccount();
  const [animationState, setAnimationState] = useState<
    "waiting" | "running" | "completed"
  >(skipLogoAnimation ? "completed" : "waiting");

  const isClient = useIsClient();

  const showLogo =
    (!accountId && isAccountLoading) || animationState === "running";

  useInitialPanelStateFromQuery(!showLogo, props.setPanelObject);

  return (
    <>
      {!skipLogoAnimation && creds?.uri && isClient && (
        <AnimatedLogo
          show={showLogo}
          withBackground
          withLoadingSpinner
          hideLoadingSpinner={animationState !== "completed"}
          speed="fast"
          onAnimationStart={() => setAnimationState("running")}
          onAnimationComplete={() => setAnimationState("completed")}
        />
      )}
      {accountId && !isAccountLoading && (
        <TabbedObjectSearch
          initial={{ opacity: 0 }}
          animate={{ opacity: animationState === "running" ? 0 : 1 }}
          key={`${creds?.uri}-${accountId}`}
          accountId={accountId}
          {...props}
        />
      )}
      {!accountId && !isAccountLoading && animationState !== "running" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-base">
          <p className="text-3xl font-semibold">Something went wrong...</p>
          <p>We are having trouble accessing your Skylark Account ID.</p>
          <p>Please contact our Customer Success team.</p>
        </div>
      )}
    </>
  );
};
