import clsx from "clsx";
import dayjs from "dayjs";
import { Fragment, useEffect, useMemo, useState } from "react";

import { AvailabilityLabel } from "src/components/availability";
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
import { InfoTooltip } from "src/components/tooltip/tooltip.component";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useGetObjectAvailability } from "src/hooks/objects/get/useGetObjectAvailability";
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

const AvailabilityValueGrid = ({
  header,
  data,
}: {
  header: string;
  data: { key: string; label: string; value: string }[];
}) => {
  return (
    <div className="mt-3">
      <h4 className="font-semibold">{header}</h4>
      {data.length > 0 && (
        <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 break-words text-base-content">
          {data.map(({ key, label, value }) => (
            <Fragment key={key}>
              <span>{`${label}:`}</span>
              <span>{value}</span>
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

const InheritanceSummary = ({
  availability,
}: {
  objectType: SkylarkObjectType;
  availability: ParsedSkylarkObjectAvailabilityObject;
}) => {
  const isEnabled = availability.active;

  return (
    (availability.inherited || availability.inheritanceSource) && (
      <div className="flex justify-between w-full mb-2">
        {availability.inherited && (
          <div className="ml-0 flex items-center whitespace-pre mt-0 text-manatee-400">
            <p className="font-semibold">Inherited</p>
            <InfoTooltip
              tooltip={
                <div>
                  <p>
                    This Availability is inherited from one or more
                    relationships.
                  </p>
                  {/* <button className="mt-2 hover:text-brand-primary underline transition-colors">
                    Show me where this is inherited from
                  </button> */}
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

const PanelAvailabilityEditView = ({
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
    <div>
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
    </div>
  );
};

export const PanelAvailability = (props: PanelAvailabilityProps) => {
  const {
    isPage,
    objectType,
    uid,
    language,
    inEditMode,
    setPanelObject,
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

  const now = dayjs();

  const availabilityObjects = useMemo(
    () => mergeServerAndModifiedAvailability(data, modifiedAvailabilityObjects),
    [data, modifiedAvailabilityObjects],
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

  const inheritedObjects = data?.filter(({ inherited }) => !!inherited) || [];

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
            {!isLoading && data?.length === 0 && !inEditMode && (
              <PanelEmptyDataText />
            )}
            {inEditMode ? (
              <PanelAvailabilityEditView
                {...props}
                availabilityObjects={availabilityObjects}
                inheritedObjects={inheritedObjects}
                removeAvailabilityObject={removeAvailabilityObject}
                toggleInheritedAvailability={toggleInheritedAvailabilityObject}
              />
            ) : (
              data.map((obj) => {
                const neverExpires = !!(obj.end && is2038Problem(obj.end));
                const status = getSingleAvailabilityStatus(
                  now,
                  obj.start || "",
                  obj.end || "",
                );

                const availabilityInfo: {
                  key: keyof Omit<
                    ParsedSkylarkObjectAvailabilityObject,
                    "dimensions"
                  >;
                  label: string;
                  value: string;
                }[] = [
                  {
                    label: "Start",
                    key: SkylarkAvailabilityField.Start,
                    value: formatReadableDateTime(
                      obj[SkylarkAvailabilityField.Start],
                    ),
                  },
                  {
                    label: "End",
                    key: SkylarkAvailabilityField.End,
                    value: neverExpires
                      ? "Never"
                      : formatReadableDateTime(
                          obj[SkylarkAvailabilityField.End],
                        ),
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
                      "my-4 max-w-xl border border-l-4 px-4 py-4 relative",
                      obj.active &&
                        status === AvailabilityStatus.Active &&
                        "border-l-success",
                      obj.active &&
                        status === AvailabilityStatus.Expired &&
                        "border-l-error",
                      obj.active &&
                        status === AvailabilityStatus.Future &&
                        "border-l-warning",
                      !obj.active && "opacity-50",
                    )}
                  >
                    <InheritanceSummary
                      objectType={props.objectType}
                      availability={obj}
                    />
                    <div className="flex items-start">
                      <div className="flex-grow">
                        <PanelFieldTitle
                          text={
                            obj.title || obj.slug || obj.external_id || obj.uid
                          }
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
                      <div className="flex items-end flex-col">
                        <div className="flex items-center justify-center">
                          {status && (
                            <AvailabilityLabel
                              status={status}
                              className="pl-1 pr-2"
                            />
                          )}
                          <OpenObjectButton
                            onClick={() =>
                              setPanelObject({
                                uid: obj.uid,
                                objectType:
                                  BuiltInSkylarkObjectType.Availability,
                                language: "",
                              })
                            }
                            disabled={inEditMode}
                          />
                        </div>
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
                  </div>
                );
              })
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
