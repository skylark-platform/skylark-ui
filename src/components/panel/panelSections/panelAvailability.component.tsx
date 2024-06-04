import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";
import { AnimatePresence, m } from "framer-motion";
import { Fragment, ReactNode, useMemo, useState } from "react";

import {
  AvailabilityInheritanceIcon,
  AvailabilityLabel,
} from "src/components/availability";
import { OpenObjectButton } from "src/components/button";
import { Switch } from "src/components/inputs/switch/switch.component";
import { DisplayGraphQLQuery, SearchObjectsModal } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  HandleDropError,
  handleDroppedAvailabilities,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelButton,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { Tab, Tabs } from "src/components/tabs/tabs.component";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useIsDragging } from "src/hooks/dnd/useIsDragging";
import { usePanelDropzone } from "src/hooks/dnd/usePanelDropzone";
import { useGetObjectAvailability } from "src/hooks/objects/get/useGetObjectAvailability";
import { useGetObjectAvailabilityInheritance } from "src/hooks/objects/get/useGetObjectAvailabilityInheritance";
import { PanelTab, PanelTabState, SetPanelObject } from "src/hooks/state";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  AvailabilityStatus,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  ParsedSkylarkObjectAvailabilityObject,
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  SkylarkAvailabilityField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { DragType, DroppableType } from "src/lib/dndkit/dndkit";
import {
  formatReadableDateTime,
  getAvailabilityStatusForAvailabilityObject,
  getRelativeTimeFromDate,
  getSingleAvailabilityStatus,
  is2038Problem,
} from "src/lib/skylark/availability";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAvailabilityProps {
  isPage?: boolean;
  objectType: string;
  uid: string;
  language: string;
  inEditMode: boolean;
  setPanelObject: SetPanelObject;
  modifiedAvailabilityObjects: {
    added: ParsedSkylarkObject[];
    removed: string[];
  } | null;
  setAvailabilityObjects: (
    a: {
      added: ParsedSkylarkObject[];
      removed: string[];
    },
    errors: HandleDropError[],
  ) => void;
  tabState: PanelTabState[PanelTab.Availability];
  updateActivePanelTabState: (s: Partial<PanelTabState>) => void;
}

type TabID = "overview" | "inheritedBy" | "inheritedFrom";

const activeAvailabilityTabs: Tab<TabID>[] = [
  { id: "overview", name: "Overview" },
  { id: "inheritedBy", name: "Inherited by" },
  { id: "inheritedFrom", name: "Inherited from" },
];

const sortDimensionsByTitleOrSlug = (
  a: SkylarkGraphQLAvailabilityDimensionWithValues,
  b: SkylarkGraphQLAvailabilityDimensionWithValues,
): number =>
  (a.title || a.slug) > (b.title || b.slug)
    ? 1
    : (b.title || b.slug) > (a.title || a.slug)
      ? -1
      : 0;

const AvailabilityValueGrid = ({
  header,
  data,
  onForwardClick,
}: {
  header: string;
  data: {
    key: string;
    label: string;
    value: ReactNode;
    forwardObject?: SkylarkObjectIdentifier;
  }[];
  onForwardClick?: (o: SkylarkObjectIdentifier) => void;
}) => {
  return (
    <div className="mt-3">
      <h4 className="font-semibold">{header}</h4>
      {data.length > 0 && (
        <div
          className={clsx(
            "mt-1 grid gap-x-2 gap-y-0.5 break-words text-base-content w-full",
            onForwardClick
              ? "grid-cols-[auto_minmax(0,_1fr)_auto]"
              : "grid-cols-[auto_minmax(0,_1fr)]",
          )}
        >
          {data.map(({ key, label, value, forwardObject }) => (
            <Fragment key={key}>
              <span>{`${label}:`}</span>
              {typeof value === "string" ? <span>{value}</span> : <>{value}</>}
              {onForwardClick &&
                (forwardObject ? (
                  <OpenObjectButton
                    onClick={() => onForwardClick(forwardObject)}
                  />
                ) : (
                  <span></span>
                ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const convertAvailabilityToParsedObjects = (
  availabilityObjects: ParsedSkylarkObjectAvailabilityObject[],
): ParsedSkylarkObject[] => {
  const parsedObjects = availabilityObjects.map(
    ({
      uid,
      start,
      end,
      external_id,
      title,
      slug,
      timezone,
    }): ParsedSkylarkObject => ({
      uid,
      config: {},
      meta: {
        language: "",
        availableLanguages: [],
        availabilityStatus: null,
      },
      availability: {
        status: null,
        objects: [],
      },
      objectType: BuiltInSkylarkObjectType.Availability,
      metadata: {
        uid,
        start,
        end,
        external_id,
        title,
        slug,
        timezone,
      },
    }),
  );
  return parsedObjects;
};

const mergeServerAndModifiedAvailability = (
  serverAvailability: ParsedSkylarkObjectAvailabilityObject[] | undefined,
  modifiedAvailabilityObjects: PanelAvailabilityProps["modifiedAvailabilityObjects"],
) => {
  if (!serverAvailability) {
    return [];
  }

  const parsedServerObjects =
    convertAvailabilityToParsedObjects(serverAvailability);

  if (!modifiedAvailabilityObjects) {
    return parsedServerObjects;
  }

  const inheritedUids = serverAvailability
    .filter(({ inherited }) => inherited)
    .map(({ uid }) => uid);

  // Ensure we keep all the inherited objects always as they are enabled/disabled, not removed
  const filteredServerObjects = parsedServerObjects.filter(
    ({ uid }) =>
      inheritedUids.includes(uid) ||
      !modifiedAvailabilityObjects.removed.includes(uid),
  );

  // Return filteredServerObjects and remove any inheritedUids that are duplicated in the added array
  return [
    ...filteredServerObjects,
    ...modifiedAvailabilityObjects.added.filter(
      ({ uid }) => !inheritedUids.includes(uid),
    ),
  ];
};

const SectionHeader = ({
  title,
  className,
}: {
  title: string;
  className?: string;
}) => <h3 className={clsx("mb-2 font-semibold pb-2", className)}>{title}</h3>;

const InheritanceSummary = ({
  availability,
  status,
  setActiveAvailability,
}: {
  objectType: SkylarkObjectType;
  availability: ParsedSkylarkObjectAvailabilityObject;
  status: AvailabilityStatus | null;
  setActiveAvailability: (
    a: { object: ParsedSkylarkObjectAvailabilityObject; tabId: TabID } | null,
  ) => void;
}) => {
  const isEnabled = availability.active;

  return (
    availability.inherited && (
      <div className="flex justify-between w-full mb-2">
        {availability.inherited && (
          <div className="ml-0 flex items-center whitespace-pre mt-0 text-manatee-400">
            <p className="font-semibold">Inherited</p>
            <AvailabilityInheritanceIcon
              className="h-4 w-4"
              status={
                availability.active ? status : AvailabilityStatus.Unavailable
              }
              tooltip={
                <div>
                  <p>
                    This Availability is inherited from one or more
                    relationships.
                  </p>
                  <button
                    className="mt-2 hover:text-brand-primary underline transition-colors"
                    onClick={() =>
                      setActiveAvailability({
                        object: availability,
                        tabId: activeAvailabilityTabs[2].id,
                      })
                    }
                  >
                    Show me where this is inherited from
                  </button>
                </div>
              }
            />
          </div>
        )}
        <div className="flex items-center justify-end gap-x-1 text-manatee-400 font-semibold">
          <p>{isEnabled ? "Enabled" : "Disabled"}</p>
          {/* <Switch size="small" enabled={isEnabled} /> */}
        </div>
      </div>
    )
  );
};

const PanelAvailabilityEditViewSection = ({
  availabilityObjects,
  modifiedAvailabilityObjects,
  inEditMode,
  inheritedObjects,
  setPanelObject,
  removeAvailabilityObject,
  toggleInheritedAvailability,
}: {
  removeAvailabilityObject: (uid: string) => void;
  toggleInheritedAvailability: (o: {
    newActive: boolean;
    parsedObject: ParsedSkylarkObject;
    isActiveOnServer: boolean;
  }) => void;
  availabilityObjects: ParsedSkylarkObject[];
  inheritedObjects: ParsedSkylarkObjectAvailabilityObject[];
} & PanelAvailabilityProps) => {
  const inheritedUids = inheritedObjects?.map(({ uid }) => uid);
  const activeInheritedUids = inheritedObjects
    ?.filter(({ active }) => !!active)
    .map(({ uid }) => uid);

  return (
    <div className="mb-8">
      {availabilityObjects?.map((obj) => {
        const isInherited = inheritedUids.includes(obj.uid);
        const initialActiveFromServer = activeInheritedUids.includes(obj.uid);
        const hasSwitchedToEnabled = Boolean(
          modifiedAvailabilityObjects?.added.find(({ uid }) => uid === obj.uid),
        );
        const hasSwitchedToDisabled = Boolean(
          modifiedAvailabilityObjects?.removed.includes(obj.uid),
        );

        const clientHasChangedActive =
          hasSwitchedToEnabled || hasSwitchedToDisabled;

        const isActive = clientHasChangedActive
          ? hasSwitchedToEnabled
          : initialActiveFromServer;
        return (
          <div key={obj.uid} className="flex items-center">
            <ObjectIdentifierCard
              key={`availability-edit-card-${obj.uid}`}
              object={obj}
              disableForwardClick={inEditMode}
              hideObjectType
              onForwardClick={setPanelObject}
              onDeleteClick={
                isInherited
                  ? undefined
                  : () => removeAvailabilityObject(obj.uid)
              }
            >
              <AvailabilityLabel
                status={getAvailabilityStatusForAvailabilityObject(
                  obj.metadata,
                )}
              />
              {isInherited && (
                <div>
                  <Switch
                    size="small"
                    enabled={isActive}
                    onChange={(active) =>
                      toggleInheritedAvailability({
                        newActive: active,
                        parsedObject: obj,
                        isActiveOnServer: initialActiveFromServer,
                      })
                    }
                  />
                </div>
              )}
            </ObjectIdentifierCard>
          </div>
        );
      })}
      {availabilityObjects.length === 0 && <PanelEmptyDataText />}
    </div>
  );
};

const PanelAvailabilityEditView = ({
  availabilityObjects,
  inheritedUids,
  ...props
}: {
  removeAvailabilityObject: (uid: string) => void;
  availabilityObjects: ParsedSkylarkObject[];
  inheritedUids: string[];
  toggleInheritedAvailability: (o: {
    newActive: boolean;
    parsedObject: ParsedSkylarkObject;
    isActiveOnServer: boolean;
  }) => void;
  inheritedObjects: ParsedSkylarkObjectAvailabilityObject[];
} & PanelAvailabilityProps) => {
  return (
    <div>
      <SectionHeader key="assigned-title" title={"Assigned"} />
      <PanelAvailabilityEditViewSection
        availabilityObjects={availabilityObjects.filter(
          ({ uid }) => !inheritedUids.includes(uid),
        )}
        {...props}
      />
      <SectionHeader key="inherited-title" title={"Inherited"} />
      <PanelAvailabilityEditViewSection
        availabilityObjects={availabilityObjects.filter(({ uid }) =>
          inheritedUids.includes(uid),
        )}
        {...props}
      />
    </div>
  );
};

const PanelAvailabilityInheritanceObjects = ({
  activeTabId,
  objectType,
  objectUid,
  availabilityUid,
  setPanelObject,
}: {
  activeTabId: TabID;
  objectType: string;
  objectUid: string;
  availabilityUid: string;
  setPanelObject: SetPanelObject;
}) => {
  const {
    data: inheritanceData,
    hasNextPage,
    fetchNextPage,
    isLoading,
  } = useGetObjectAvailabilityInheritance({
    objectType,
    objectUid,
    availabilityUid,
  });

  const objects =
    activeTabId === "inheritedBy"
      ? inheritanceData?.inheritedBy
      : inheritanceData?.inheritedFrom;

  return (
    <div className="h-3/4 mt-2">
      <div className="h-full overflow-y-scroll">
        {objects?.map((obj) => (
          <ObjectIdentifierCard
            key={obj.uid}
            object={obj}
            onForwardClick={setPanelObject}
            hideAvailabilityStatus
          />
        ))}
        {!isLoading && (!objects || objects.length === 0) && (
          <PanelEmptyDataText />
        )}
        <PanelLoading
          loadMore={fetchNextPage}
          isLoading={hasNextPage || isLoading}
        />
      </div>
    </div>
  );
};

const PanelAvailabilityReadonlyCard = ({
  isActive,
  now,
  availability,
  tabId,
  objectType,
  objectUid,
  setActiveAvailability,
  setPanelObject,
}: {
  isActive?: boolean;
  availability: ParsedSkylarkObjectAvailabilityObject;
  tabId?: TabID;
  setActiveAvailability: (
    a: {
      object: ParsedSkylarkObjectAvailabilityObject;
      tabId: TabID;
    } | null,
  ) => void;
  setPanelObject: SetPanelObject;
  now: Dayjs;
  objectType: string;
  objectUid: string;
}) => {
  const activeTabId: TabID = (isActive && tabId) || "overview";

  const neverExpires = !!(availability.end && is2038Problem(availability.end));
  const status = getSingleAvailabilityStatus(
    now,
    availability.start || "",
    availability.end || "",
  );

  const availabilityInfo: {
    key: keyof Omit<ParsedSkylarkObjectAvailabilityObject, "dimensions">;
    label: string;
    value: string;
  }[] = [
    {
      label: "Start",
      key: SkylarkAvailabilityField.Start,
      value: formatReadableDateTime(
        availability[SkylarkAvailabilityField.Start],
      ),
    },
    {
      label: "End",
      key: SkylarkAvailabilityField.End,
      value: neverExpires
        ? "Never"
        : formatReadableDateTime(availability[SkylarkAvailabilityField.End]),
    },
    {
      label: "Timezone",
      key: SkylarkAvailabilityField.Timezone,
      value: availability[SkylarkAvailabilityField.Timezone] || "",
    },
  ];
  return (
    <m.div
      key={`availability-card-inner-${availability.uid}`}
      className={clsx("flex items-start z-10 bg-white mb-2")}
      layout
      initial={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ ease: "linear", duration: 0.05 }}
      animate={
        isActive
          ? {
              opacity: 1,
              marginLeft: 0,
              marginRight: 0,
              height: "100%",
            }
          : {
              opacity: 1,
              height: "auto",
            }
      }
    >
      <m.div
        className={clsx(
          "border border-l-4 py-4 h-full w-full relative transition-all",
          availability.active &&
            status === AvailabilityStatus.Active &&
            "border-l-success",
          availability.active &&
            status === AvailabilityStatus.Expired &&
            "border-l-error",
          availability.active &&
            status === AvailabilityStatus.Future &&
            "border-l-warning",
          !availability.active && "opacity-70",
          isActive ? "px-4 md:px-8" : "px-2 md:px-4 max-w-xl",
        )}
        layout
        transition={{ duration: 0.05 }}
      >
        <m.div
          className={clsx("absolute", isActive ? "left-2" : "-left-7")}
          transition={{ ease: "linear", duration: 0.05 }}
        >
          <PanelButton
            type={isActive ? "x" : "maximise"}
            aria-label={`${isActive ? "close" : "expand"} availability: ${
              availability.title || availability.slug || availability.uid
            }`}
            className="mr-1"
            onClick={() =>
              setActiveAvailability(
                isActive
                  ? null
                  : {
                      object: availability,
                      tabId: activeAvailabilityTabs[0].id,
                    },
              )
            }
          />
        </m.div>
        <InheritanceSummary
          objectType={objectType}
          availability={availability}
          status={status}
          setActiveAvailability={setActiveAvailability}
        />
        <div className="flex items-start">
          <div className="flex-grow">
            <PanelFieldTitle
              text={
                availability.title ||
                availability.slug ||
                availability.external_id ||
                availability.uid
              }
            />
            <p className="text-manatee-400">
              {status &&
                getRelativeTimeFromDate(
                  status,
                  availability.start || "",
                  availability.end || "",
                )}
            </p>
          </div>

          <div className="flex items-center justify-center">
            {status && (
              <AvailabilityLabel status={status} className="pl-1 pr-2" />
            )}
            <OpenObjectButton
              onClick={() =>
                setPanelObject({
                  uid: availability.uid,
                  objectType: BuiltInSkylarkObjectType.Availability,
                  language: "",
                })
              }
            />
          </div>
        </div>

        {isActive && (
          <m.div
            className="-mx-4 mt-4"
            layout="size"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: "linear", duration: 0.1 }}
          >
            <Tabs
              tabs={activeAvailabilityTabs}
              onChange={(tab) =>
                setActiveAvailability({
                  object: availability,
                  tabId: tab.id as TabID,
                })
              }
              fillWidth
              selectedTab={tabId || activeAvailabilityTabs[0].id}
            />
          </m.div>
        )}

        {activeTabId === "overview" && (
          <>
            <AvailabilityValueGrid
              header="Time Window"
              data={availabilityInfo}
            />

            <AvailabilityValueGrid
              header="Audience"
              data={availability.dimensions
                .sort(sortDimensionsByTitleOrSlug)
                .map((dimension) => ({
                  label: dimension.title || dimension.slug,
                  value: dimension.values.objects
                    .map((value) => value.title || value.slug)
                    .sort()
                    .join(", "),
                  key: dimension.uid,
                }))}
            />
          </>
        )}
        {(activeTabId === "inheritedBy" || activeTabId === "inheritedFrom") && (
          <PanelAvailabilityInheritanceObjects
            key={activeTabId}
            activeTabId={activeTabId}
            objectType={objectType}
            objectUid={objectUid}
            availabilityUid={availability.uid}
            setPanelObject={setPanelObject}
          />
        )}
      </m.div>
    </m.div>
  );
};

const PanelAvailabilityReadOnlyView = ({
  activeAvailability,
  assignedAvails,
  inheritedAvails,
  setActiveAvailability,
  now,
  ...props
}: {
  activeAvailability: {
    object: ParsedSkylarkObjectAvailabilityObject;
    tabId: TabID;
  } | null;
  assignedAvails: ParsedSkylarkObjectAvailabilityObject[];
  inheritedAvails: ParsedSkylarkObjectAvailabilityObject[];
  setActiveAvailability: (
    a: { object: ParsedSkylarkObjectAvailabilityObject; tabId: TabID } | null,
  ) => void;
  now: Dayjs;
} & PanelAvailabilityProps) => {
  return (
    <>
      {!activeAvailability && (
        <>
          <SectionHeader key="assigned-title" title={"Assigned"} />
          {assignedAvails.length === 0 && <PanelEmptyDataText />}
        </>
      )}
      {assignedAvails.map((availability) => (
        <PanelAvailabilityReadonlyCard
          key={`availability-card-${availability.uid}`}
          isActive={activeAvailability?.object.uid === availability.uid}
          availability={availability}
          setActiveAvailability={setActiveAvailability}
          setPanelObject={props.setPanelObject}
          now={now}
          objectType={props.objectType}
          tabId={activeAvailability?.tabId}
          objectUid={props.uid}
        />
      ))}
      {!activeAvailability && (
        <>
          <SectionHeader
            key="inherited-title"
            title={"Inherited"}
            className="mt-8"
          />
          {inheritedAvails.length === 0 && <PanelEmptyDataText />}
        </>
      )}
      {inheritedAvails.map((availability) => (
        <PanelAvailabilityReadonlyCard
          key={`availability-card-${availability.uid}`}
          isActive={activeAvailability?.object.uid === availability.uid}
          availability={availability}
          setActiveAvailability={setActiveAvailability}
          setPanelObject={props.setPanelObject}
          now={now}
          objectType={props.objectType}
          objectUid={props.uid}
          tabId={activeAvailability?.tabId}
        />
      ))}
    </>
  );
};

export const PanelAvailability = (props: PanelAvailabilityProps) => {
  const {
    isPage,
    objectType,
    uid,
    language,
    inEditMode,
    modifiedAvailabilityObjects,
    tabState,
    setAvailabilityObjects,
    updateActivePanelTabState,
  } = props;

  const [activeAvailability, setActiveAvailability] = useState<{
    object: ParsedSkylarkObjectAvailabilityObject;
    tabId: TabID;
  } | null>(
    tabState.active
      ? {
          object: tabState.active.object,
          tabId: tabState.active.tabId as TabID,
        }
      : null,
  );

  const setActiveAvailabilityWrapper = (
    newActiveAvailability: {
      object: ParsedSkylarkObjectAvailabilityObject;
      tabId: TabID;
    } | null,
  ) => {
    setActiveAvailability(newActiveAvailability);
    updateActivePanelTabState({
      [PanelTab.Availability]: {
        active: newActiveAvailability,
      },
    });
  };

  const { data, hasNextPage, isLoading, fetchNextPage, query, variables } =
    useGetObjectAvailability(objectType, uid, { language });

  const [objectSearchModalOpen, setObjectSearchModalOpen] = useState(false);

  const { objectOperations: availabilityObjectMeta } =
    useSkylarkObjectOperations(BuiltInSkylarkObjectType.Availability);

  const availabilityObjects = useMemo(
    () => mergeServerAndModifiedAvailability(data, modifiedAvailabilityObjects),
    [data, modifiedAvailabilityObjects],
  );

  const { assignedAvails, inheritedAvails, inheritedUids } = useMemo(() => {
    const availabilities = activeAvailability
      ? data?.filter(({ uid }) => uid === activeAvailability.object.uid)
      : data;

    return (
      availabilities?.reduce(
        (prev, object) => {
          if (object.inherited) {
            return {
              ...prev,
              inheritedAvails: [...prev.inheritedAvails, object],
              inheritedUids: [...prev.inheritedUids, object.uid],
            };
          }

          return {
            ...prev,
            assignedAvails: [...prev.assignedAvails, object],
          };
        },
        {
          inheritedAvails: [] as ParsedSkylarkObjectAvailabilityObject[],
          inheritedUids: [] as string[],
          assignedAvails: [] as ParsedSkylarkObjectAvailabilityObject[],
        },
      ) || {
        inheritedAvails: [],
        inheritedUids: [],
        assignedAvails: [],
      }
    );
  }, [activeAvailability, data]);

  const removeAvailabilityObject = (uidToRemove: string) => {
    const uidIsNewlyAdded = modifiedAvailabilityObjects?.added.find(
      ({ uid }) => uid === uidToRemove,
    );

    const previousAdded = modifiedAvailabilityObjects?.added || [];
    const previousRemoved = modifiedAvailabilityObjects?.removed || [];

    // Handle the uidToRemove being in the added array rather than from the server data
    const removed = uidIsNewlyAdded
      ? previousRemoved
      : [...previousRemoved, uidToRemove];
    const added = uidIsNewlyAdded
      ? previousAdded.filter(({ uid }) => uidToRemove !== uid)
      : previousAdded;

    setAvailabilityObjects(
      {
        added,
        removed,
      },
      [],
    );
  };

  const toggleInheritedAvailabilityObject = ({
    newActive,
    parsedObject,
  }: {
    newActive: boolean;
    parsedObject: ParsedSkylarkObject;
    isActiveOnServer: boolean;
  }) => {
    const previousAdded = modifiedAvailabilityObjects?.added || [];
    const previousAddedUids = previousAdded.map(({ uid }) => uid);
    const previousRemoved = modifiedAvailabilityObjects?.removed || [];

    if (newActive) {
      setAvailabilityObjects(
        {
          added: previousAddedUids.includes(parsedObject.uid)
            ? previousAdded
            : [...previousAdded, parsedObject],
          removed: previousRemoved.filter((uid) => uid !== parsedObject.uid),
        },
        [],
      );
      return;
    }

    setAvailabilityObjects(
      {
        added: previousAdded.filter(({ uid }) => uid !== parsedObject.uid),
        removed: previousRemoved.includes(uid)
          ? previousRemoved
          : [...previousRemoved, parsedObject.uid],
      },
      [],
    );
  };

  const [showDropZone] = useIsDragging(DragType.CONTENT_LIBRARY_OBJECT);

  usePanelDropzone(DroppableType.PANEL_GENERIC, {
    onObjectsDropped: (droppedObjects) => {
      if (droppedObjects && droppedObjects.length > 0) {
        const { addedObjects, errors } = handleDroppedAvailabilities({
          droppedObjects,
          existingObjects: availabilityObjects,
          activeObjectUid: uid,
        });

        setAvailabilityObjects(
          {
            removed: modifiedAvailabilityObjects?.removed || [],
            added: [
              ...(modifiedAvailabilityObjects?.added || []),
              ...addedObjects,
            ],
          },
          errors,
        );
      }
    },
  });

  if (showDropZone) {
    return <PanelDropZone />;
  }

  const now = dayjs();
  const inheritedObjects = data?.filter(({ inherited }) => !!inherited) || [];

  return (
    <PanelSectionLayout
      withoutPadding={!!activeAvailability}
      sections={[
        {
          id: "availability",
          htmlId: "availability-panel-header",
          title: "Availability",
        },
      ]}
      isPage={isPage}
    >
      <div
        data-testid="panel-availability"
        className={clsx(activeAvailability ? "h-full" : "pb-48")}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {!activeAvailability && (
            <m.div
              key="the-main-title"
              className="flex items-center"
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.02 }}
              initial={{ opacity: 0 }}
            >
              <PanelSectionTitle
                text={formatObjectField("Availability")}
                id={"availability-panel-header"}
              />
              <PanelButton
                type="plus"
                onClick={() => setObjectSearchModalOpen(true)}
              />
            </m.div>
          )}
          {data && (
            <>
              {inEditMode ? (
                <PanelAvailabilityEditView
                  {...props}
                  availabilityObjects={availabilityObjects}
                  inheritedObjects={inheritedObjects}
                  removeAvailabilityObject={removeAvailabilityObject}
                  inheritedUids={inheritedUids}
                  toggleInheritedAvailability={
                    toggleInheritedAvailabilityObject
                  }
                />
              ) : (
                <PanelAvailabilityReadOnlyView
                  {...props}
                  activeAvailability={activeAvailability}
                  assignedAvails={assignedAvails}
                  inheritedAvails={inheritedAvails}
                  setActiveAvailability={setActiveAvailabilityWrapper}
                  now={now}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </div>
      <PanelLoading
        isLoading={isLoading || hasNextPage}
        loadMore={() => fetchNextPage()}
      >
        <Skeleton className="mb-4 h-52 w-full max-w-xl" />
        <Skeleton className="mb-4 h-52 w-full max-w-xl" />
      </PanelLoading>
      <DisplayGraphQLQuery
        label="Get Object Availability"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
      {data && availabilityObjectMeta && (
        <SearchObjectsModal
          title={`Add Availability`}
          isOpen={objectSearchModalOpen}
          objectTypes={[BuiltInSkylarkObjectType.Availability]}
          columns={[
            OBJECT_LIST_TABLE.columnIds.displayField,
            ...availabilityObjectMeta.fields.map(({ name }) => name),
          ]}
          closeModal={() => setObjectSearchModalOpen(false)}
          onSave={({ checkedObjectsState }) => {
            const { addedObjects, errors } = handleDroppedAvailabilities({
              droppedObjects: checkedObjectsState
                .filter(({ checkedState }) => checkedState === true)
                .map(({ object }) => object),
              existingObjects: availabilityObjects,
              activeObjectUid: uid,
            });

            setAvailabilityObjects(
              {
                removed: modifiedAvailabilityObjects?.removed || [],
                added: [
                  ...(modifiedAvailabilityObjects?.added || []),
                  ...addedObjects,
                ],
              },
              errors,
            );
          }}
        />
      )}
    </PanelSectionLayout>
  );
};
