import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";
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
    <h3 className="mb-2 font-semibold">{title}</h3>
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

const PanelAvailabilityItemInheritanceGrid = ({
  availability,
  setPanelObject,
}: {
  availability: ParsedSkylarkObjectAvailabilityObject;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}) => {
  const { data: fromObject } = useGetObjectGeneric(
    {
      uid: availability.inherited.from || "",
      objectTypes: null,
    },
    true,
  );

  const { data: viaObject } = useGetObjectGeneric(
    {
      uid: availability.inherited.via || "",
      objectTypes: null,
    },
    true,
  );

  return (
    <AvailabilityValueGrid
      header="Inheritance"
      onForwardClick={setPanelObject}
      data={[
        {
          label: "From",
          key: "from",
          value: fromObject ? (
            <div className="overflow-hidden whitespace-nowrap text-ellipsis">
              <ObjectTypePill
                type={fromObject.objectType}
                className="mr-1 w-20"
              />
              <span className="text-ellipsis">
                {fromObject && getObjectDisplayName(fromObject)}
              </span>
            </div>
          ) : (
            availability.inherited.from || ""
          ),
          forwardObject: fromObject
            ? convertParsedObjectToIdentifier(fromObject)
            : undefined,
        },
        {
          label: "Via",
          key: "via",
          value: viaObject ? (
            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
              <ObjectTypePill
                type={viaObject.objectType}
                className="mr-1 w-20"
              />
              <span className="text-ellipsis overflow-hidden">
                {viaObject && getObjectDisplayName(viaObject)}
              </span>
            </div>
          ) : (
            availability.inherited.via || ""
          ),
          forwardObject: viaObject
            ? convertParsedObjectToIdentifier(viaObject)
            : undefined,
        },
      ]}
    />
  );
};

const PanelAvailabilityReadOnlyList = ({
  title,
  availabilityObjects,
  inEditMode,
  setPanelObject,
  now,
}: {
  title: string;
  availabilityObjects: ParsedSkylarkObjectAvailabilityObject[];
  now: Dayjs;
} & PanelAvailabilityProps) => {
  return (
    <AvailabilitySectionWrapperAndTitle title={title}>
      {availabilityObjects.map((obj) => {
        const neverExpires = !!(obj.end && is2038Problem(obj.end));
        const status = getSingleAvailabilityStatus(
          now,
          obj.start || "",
          obj.end || "",
        );

        const availabilityInfo: {
          key: keyof Omit<ParsedSkylarkObjectAvailabilityObject, "dimensions">;
          label: string;
          value: string;
        }[] = [
          {
            label: "Start",
            key: SkylarkAvailabilityField.Start,
            value: formatReadableDateTime(obj[SkylarkAvailabilityField.Start]),
          },
          {
            label: "End",
            key: SkylarkAvailabilityField.End,
            value: neverExpires
              ? "Never"
              : formatReadableDateTime(obj[SkylarkAvailabilityField.End]),
          },
          {
            label: "Timezone",
            key: SkylarkAvailabilityField.Timezone,
            value: obj[SkylarkAvailabilityField.Timezone] || "",
          },
        ];
        return (
          <div
            key={`availability-card-${obj.uid}`}
            className={clsx(
              "my-4 max-w-xl border border-l-4 px-4 py-4",
              status === AvailabilityStatus.Active && "border-l-success",
              status === AvailabilityStatus.Expired && "border-l-error",
              status === AvailabilityStatus.Future && "border-l-warning",
              !obj.active && "opacity-40",
            )}
          >
            <div className="flex items-start">
              <div className="flex-grow">
                <PanelFieldTitle
                  text={obj.title || obj.slug || obj.external_id || obj.uid}
                />
                <p className="text-manatee-400">
                  {status &&
                    getRelativeTimeFromDate(
                      status,
                      obj.start || "",
                      obj.end || "",
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
                      uid: obj.uid,
                      objectType: BuiltInSkylarkObjectType.Availability,
                      language: "",
                    })
                  }
                  disabled={inEditMode}
                />
              </div>
            </div>

            <AvailabilityValueGrid
              header="Time Window"
              data={availabilityInfo}
            />

            <AvailabilityValueGrid
              header="Audience"
              data={obj.dimensions
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

            {obj.hasInheritance && (
              <PanelAvailabilityItemInheritanceGrid
                availability={obj}
                setPanelObject={setPanelObject}
              />
            )}
          </div>
        );
      })}
      {availabilityObjects.length === 0 && <PanelEmptyDataText />}
    </AvailabilitySectionWrapperAndTitle>
  );
};

const PanelAvailabilityReadOnlyView = ({
  assignedAvails,
  inheritedAvails,
  ...props
}: {
  assignedAvails: ParsedSkylarkObjectAvailabilityObject[];
  inheritedAvails: ParsedSkylarkObjectAvailabilityObject[];
} & PanelAvailabilityProps) => {
  const now = dayjs();

  return (
    <>
      <PanelAvailabilityReadOnlyList
        {...props}
        title="Assigned"
        availabilityObjects={assignedAvails}
        now={now}
      />
      <PanelAvailabilityReadOnlyList
        {...props}
        title="Inherited"
        availabilityObjects={inheritedAvails}
        now={now}
      />
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

  const { assignedAvails, inheritedAvails, inheritedUids } = useMemo(
    () =>
      data?.reduce(
        (prev, object) => {
          if (object.hasInheritance) {
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
      },
    [data],
  );

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

  return (
    <PanelSectionLayout
      sections={[
        {
          id: "availability",
          htmlId: "availability-panel-header",
          title: "Availability",
        },
      ]}
      isPage={isPage}
    >
      <div data-testid="panel-availability">
        <div className="flex items-center">
          <PanelSectionTitle
            text={formatObjectField("Availability")}
            id={"availability-panel-header"}
          />
          <PanelButton
            type="plus"
            onClick={() => setObjectSearchModalOpen(true)}
          />
        </div>
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
                assignedAvails={assignedAvails}
                inheritedAvails={inheritedAvails}
              />
            )}
          </>
        )}
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
