import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";
import { AnimatePresence, m } from "framer-motion";
import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";

import { AvailabilityLabel } from "src/components/availability";
import { OpenObjectButton } from "src/components/button";
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
import { ObjectTypePill } from "src/components/pill";
import { Skeleton } from "src/components/skeleton";
import { Tab, Tabs } from "src/components/tabs/tabs.component";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useGetObjectAvailability } from "src/hooks/objects/get/useGetObjectAvailability";
import { useGetObjectGeneric } from "src/hooks/objects/get/useGetObjectGeneric";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  AvailabilityStatus,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  ParsedSkylarkObjectAvailabilityObject,
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  SkylarkAvailabilityField,
} from "src/interfaces/skylark";
import {
  formatReadableDateTime,
  getAvailabilityStatusForAvailabilityObject,
  getRelativeTimeFromDate,
  getSingleAvailabilityStatus,
  is2038Problem,
} from "src/lib/skylark/availability";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { formatObjectField, getObjectDisplayName } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAvailabilityProps {
  isPage?: boolean;
  objectType: string;
  uid: string;
  language: string;
  inEditMode: boolean;
  droppedObjects?: ParsedSkylarkObject[];
  showDropZone?: boolean;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
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
}

const sortDimensionsByTitleOrSlug = (
  a: SkylarkGraphQLAvailabilityDimensionWithValues,
  b: SkylarkGraphQLAvailabilityDimensionWithValues,
): number =>
  (a.title || a.slug) > (b.title || b.slug)
    ? 1
    : (b.title || b.slug) > (a.title || a.slug)
      ? -1
      : 0;

const AvailabilitySectionWrapperAndTitle = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="mb-8">
    {/* <h3 className="mb-2 font-semibold">{title}</h3> */}
    {children}
  </div>
);

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

  const filteredServerObjects = parsedServerObjects.filter(
    ({ uid }) => !modifiedAvailabilityObjects.removed.includes(uid),
  );
  return [...filteredServerObjects, ...modifiedAvailabilityObjects.added];
};

const PanelAvailabilityEditViewSection = ({
  title,
  availabilityObjects,
  inEditMode,
  setPanelObject,
  removeAvailabilityObject,
}: {
  title: string;
  availabilityObjects: ParsedSkylarkObject[];
  removeAvailabilityObject: (uid: string) => void;
} & PanelAvailabilityProps) => (
  <AvailabilitySectionWrapperAndTitle title={title}>
    {availabilityObjects?.map((obj) => {
      return (
        <div key={obj.uid} className="flex items-center">
          <ObjectIdentifierCard
            key={`availability-edit-card-${obj.uid}`}
            object={obj}
            disableForwardClick={inEditMode}
            hideObjectType
            onForwardClick={setPanelObject}
            onDeleteClick={() => removeAvailabilityObject(obj.uid)}
          >
            <AvailabilityLabel
              status={getAvailabilityStatusForAvailabilityObject(obj.metadata)}
            />
          </ObjectIdentifierCard>
        </div>
      );
    })}
    {availabilityObjects.length === 0 && <PanelEmptyDataText />}
  </AvailabilitySectionWrapperAndTitle>
);

const PanelAvailabilityEditView = ({
  availabilityObjects,
  inheritedUids,
  ...props
}: {
  removeAvailabilityObject: (uid: string) => void;
  availabilityObjects: ParsedSkylarkObject[];
  inheritedUids: string[];
} & PanelAvailabilityProps) => {
  return (
    <div>
      <PanelAvailabilityEditViewSection
        title="Assigned"
        availabilityObjects={availabilityObjects.filter(
          ({ uid }) => !inheritedUids.includes(uid),
        )}
        {...props}
      />
      <PanelAvailabilityEditViewSection
        title="Inherited"
        availabilityObjects={availabilityObjects.filter(({ uid }) =>
          inheritedUids.includes(uid),
        )}
        {...props}
      />
    </div>
  );
};

// const PanelAvailabilityItemInheritanceGrid = ({
//   availability,
//   setPanelObject,
// }: {
//   availability: ParsedSkylarkObjectAvailabilityObject;
//   setPanelObject: (o: SkylarkObjectIdentifier) => void;
// }) => {
//   const { data: fromObject } = useGetObjectGeneric(
//     {
//       uid: availability.inherited.from || "",
//       objectTypes: null,
//     },
//     true,
//   );

//   const { data: viaObject } = useGetObjectGeneric(
//     {
//       uid: availability.inherited.via || "",
//       objectTypes: null,
//     },
//     true,
//   );

//   return (
//     <AvailabilityValueGrid
//       header="Inheritance"
//       onForwardClick={setPanelObject}
//       data={[
//         {
//           label: "From",
//           key: "from",
//           value: fromObject ? (
//             <div className="overflow-hidden whitespace-nowrap text-ellipsis">
//               <ObjectTypePill
//                 type={fromObject.objectType}
//                 className="mr-1 w-20"
//               />
//               <span className="text-ellipsis">
//                 {fromObject && getObjectDisplayName(fromObject)}
//               </span>
//             </div>
//           ) : (
//             availability.inherited.from || ""
//           ),
//           forwardObject: fromObject
//             ? convertParsedObjectToIdentifier(fromObject)
//             : undefined,
//         },
//         {
//           label: "Via",
//           key: "via",
//           value: viaObject ? (
//             <div className="overflow-hidden text-ellipsis whitespace-nowrap">
//               <ObjectTypePill
//                 type={viaObject.objectType}
//                 className="mr-1 w-20"
//               />
//               <span className="text-ellipsis overflow-hidden">
//                 {viaObject && getObjectDisplayName(viaObject)}
//               </span>
//             </div>
//           ) : (
//             availability.inherited.via || ""
//           ),
//           forwardObject: viaObject
//             ? convertParsedObjectToIdentifier(viaObject)
//             : undefined,
//         },
//       ]}
//     />
//   );
// };

const PanelAvailabilityReadonlyCard = ({
  isActive,
  now,
  availability,
  setActiveAvailability,
  setPanelObject,
}: {
  isActive?: boolean;
  availability: ParsedSkylarkObjectAvailabilityObject;
  setActiveAvailability: (
    o: ParsedSkylarkObjectAvailabilityObject | null,
  ) => void;
  setPanelObject: PanelAvailabilityProps["setPanelObject"];
  now: Dayjs;
}) => {
  const [tab, setTab] = useState<Tab | null>(null);

  const activeTabId = (isActive && tab?.id) || "overview";

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
      className={clsx("flex items-start z-10 bg-white")}
      layout
      initial={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      // animate={{ opacity: 1 }}
      transition={{ ease: "linear", duration: 0.1 }}
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
              marginLeft: 32,
              marginRight: 32,
              height: "auto",
            }
      }
    >
      {/* <PanelButton
        type={isActive ? "x" : "maximise"}
        className="mr-1"
        onClick={() => setActiveAvailability(isActive ? null : availability)}
      /> */}
      <m.div
        className={clsx(
          "max-w-xl border border-l-4 py-4 h-full relative",
          status === AvailabilityStatus.Active && "border-l-success",
          status === AvailabilityStatus.Expired && "border-l-error",
          status === AvailabilityStatus.Future && "border-l-warning",
          !availability.active && "opacity-40",
        )}
        layout
        initial={{ paddingLeft: 16, paddingRight: 16 }}
        // transition={{ duration: 0.2 }}
        animate={
          isActive
            ? { paddingLeft: 32, paddingRight: 32 }
            : { paddingLeft: 16, paddingRight: 16 }
        }
      >
        <m.div
          className="-left-7 absolute"
          animate={isActive ? { left: 8 } : { left: -28 }}
          transition={{ ease: "linear", duration: 0.1 }}
        >
          <PanelButton
            type={isActive ? "x" : "maximise"}
            className="mr-1"
            onClick={() =>
              setActiveAvailability(isActive ? null : availability)
            }
          />
        </m.div>
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
              tabs={[
                { id: "overview", name: "Overview" },
                { id: "inheritedBy", name: "Inherited by" },
                { id: "inheritedFrom", name: "Inherited from" },
              ]}
              onChange={setTab}
              selectedTab={tab?.id || "overview"}
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

        {/* {obj.inherited && (
              <PanelAvailabilityItemInheritanceGrid
                availability={obj}
                setPanelObject={setPanelObject}
              />
            )} */}

        <div
          className={clsx(
            "text-gray-300 mt-4 text-xs",
            (isActive && "absolute bottom-2") || "hidden",
          )}
        >
          <p className="text-xs">DEBUG ONLY:</p>
          {/* This Availability is being inherited from a related Object */}
          <p>{`Inherited: ${availability.inherited}`}</p>
          {/* If the Availability is being inherited by a related object / This Availability is the source of the Availability of a related object */}
          <p>{`Inheritance source: ${availability.inheritanceSource}`}</p>
        </div>
      </m.div>
    </m.div>
  );
};

// const PanelAvailabilityReadOnlyList = ({
//   title,
//   activeAvailability,
//   availabilityObjects,
//   setPanelObject,
//   setActiveAvailability,
//   now,
// }: {
//   title: string;
//   activeAvailability: ParsedSkylarkObjectAvailabilityObject | null;
//   availabilityObjects: ParsedSkylarkObjectAvailabilityObject[];
//   setActiveAvailability: (
//     o: ParsedSkylarkObjectAvailabilityObject | null,
//   ) => void;
//   now: Dayjs;
// } & PanelAvailabilityProps) => {
//   return (
//     <AvailabilitySectionWrapperAndTitle title={title}>
//       {availabilityObjects.map((availability) => (
//         <PanelAvailabilityReadonlyCard
//           key={`availability-card-${availability.uid}`}
//           isActive={activeAvailability?.uid === availability.uid}
//           availability={availability}
//           setActiveAvailability={setActiveAvailability}
//           setPanelObject={setPanelObject}
//           now={now}
//         />
//       ))}
//       {availabilityObjects.length === 0 && <PanelEmptyDataText />}
//     </AvailabilitySectionWrapperAndTitle>
//   );
// };

const PanelAvailabilityReadOnlyView = ({
  activeAvailability,
  assignedAvails,
  inheritedAvails,
  setActiveAvailability,
  now,
  ...props
}: {
  activeAvailability: ParsedSkylarkObjectAvailabilityObject | null;
  assignedAvails: ParsedSkylarkObjectAvailabilityObject[];
  inheritedAvails: ParsedSkylarkObjectAvailabilityObject[];
  setActiveAvailability: (
    o: ParsedSkylarkObjectAvailabilityObject | null,
  ) => void;
  now: Dayjs;
} & PanelAvailabilityProps) => {
  return (
    <>
      {!activeAvailability && (
        <m.h3
          layout
          key="assigned-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="mb-2 font-semibold px-4 md:px-8 pt-8 pb-2"
        >
          Assigned
        </m.h3>
      )}
      {/* <PanelAvailabilityReadOnlyList
        {...props}
        title="Assigned"
        activeAvailability={activeAvailability}
        availabilityObjects={assignedAvails}
        setActiveAvailability={setActiveAvailability}
        now={now}
      /> */}
      {assignedAvails.map((availability) => (
        <PanelAvailabilityReadonlyCard
          key={`availability-card-${availability.uid}`}
          isActive={activeAvailability?.uid === availability.uid}
          availability={availability}
          setActiveAvailability={setActiveAvailability}
          setPanelObject={props.setPanelObject}
          now={now}
        />
      ))}
      {!activeAvailability && (
        <m.h3
          key="inherited-title"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="mb-2 font-semibold px-4 md:px-8 pt-8 pb-2"
        >
          Inherited
        </m.h3>
      )}
      {inheritedAvails.map((availability) => (
        <PanelAvailabilityReadonlyCard
          key={`availability-card-${availability.uid}`}
          isActive={activeAvailability?.uid === availability.uid}
          availability={availability}
          setActiveAvailability={setActiveAvailability}
          setPanelObject={props.setPanelObject}
          now={now}
        />
      ))}
    </>
  );
};

export const PanelAvailability = (props: PanelAvailabilityProps) => {
  const [activeAvailability, setActiveAvailability] =
    useState<ParsedSkylarkObjectAvailabilityObject | null>(null);

  const {
    isPage,
    objectType,
    uid,
    language,
    inEditMode,
    droppedObjects,
    showDropZone,
    modifiedAvailabilityObjects,
    setAvailabilityObjects,
  } = props;

  const { data, hasNextPage, isLoading, fetchNextPage, query, variables } =
    useGetObjectAvailability(objectType, uid, { language });

  const [objectSearchModalOpen, setObjectSearchModalOpen] = useState(false);

  const { objectOperations: availabilityObjectMeta } =
    useSkylarkObjectOperations(BuiltInSkylarkObjectType.Availability);

  const availabilityObjects = useMemo(
    () => mergeServerAndModifiedAvailability(data, modifiedAvailabilityObjects),
    [data, modifiedAvailabilityObjects],
  );

  // const availabilities = activeAvailability
  //   ? data?.filter(({ uid }) => uid === activeAvailability.uid)
  //   : data;

  const { assignedAvails, inheritedAvails, inheritedUids } = useMemo(() => {
    const availabilities = activeAvailability
      ? data?.filter(({ uid }) => uid === activeAvailability.uid)
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

  useEffect(() => {
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
  }, [
    availabilityObjects,
    droppedObjects,
    modifiedAvailabilityObjects?.added,
    modifiedAvailabilityObjects?.removed,
    uid,
    setAvailabilityObjects,
  ]);

  if (showDropZone) {
    return <PanelDropZone />;
  }

  const now = dayjs();

  return (
    <PanelSectionLayout
      withoutPadding
      sections={[
        {
          id: "availability",
          htmlId: "availability-panel-header",
          title: "Availability",
        },
      ]}
      isPage={isPage}
    >
      <div data-testid="panel-availability" className="h-full">
        <AnimatePresence initial={false} mode="popLayout">
          {/* {!activeAvailability && (
            <m.div
              key="the-main-title"
              className="flex items-center"
              layout
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
          )} */}
          {data && (
            <>
              {inEditMode ? (
                <PanelAvailabilityEditView
                  {...props}
                  availabilityObjects={availabilityObjects}
                  inheritedUids={inheritedUids}
                  removeAvailabilityObject={removeAvailabilityObject}
                />
              ) : (
                <PanelAvailabilityReadOnlyView
                  {...props}
                  activeAvailability={activeAvailability}
                  assignedAvails={assignedAvails}
                  inheritedAvails={inheritedAvails}
                  setActiveAvailability={setActiveAvailability}
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
