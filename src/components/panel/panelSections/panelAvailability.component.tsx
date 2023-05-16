import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Fragment, useEffect } from "react";

import { AvailabilityLabel } from "src/components/availability";
import { OpenObjectButton } from "src/components/button";
import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { Trash } from "src/components/icons";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { DROPPABLE_ID } from "src/constants/skylark";
import { useGetObjectAvailability } from "src/hooks/useGetObjectAvailability";
import {
  AvailabilityStatus,
  SkylarkGraphQLAvailabilityDimension,
  ParsedSkylarkObjectAvailabilityObject,
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import {
  formatReadableDate,
  getRelativeTimeFromDate,
} from "src/lib/skylark/availability";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAvailabilityProps {
  isPage?: boolean;
  objectType: string;
  objectUid: string;
  language: string;
  inEditMode: boolean;
  showDropArea?: boolean;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  setAvailability: any;
  availability: ParsedSkylarkObject[];
}

const sortDimensionsByTitleOrSlug = (
  a: SkylarkGraphQLAvailabilityDimension,
  b: SkylarkGraphQLAvailabilityDimension,
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

export const PanelAvailability = ({
  isPage,
  objectType,
  objectUid,
  language,
  inEditMode,
  setPanelObject,
  showDropArea,
  setAvailability,
  availability,
}: PanelAvailabilityProps) => {
  const { data, hasNextPage, isLoading, fetchNextPage, query, variables } =
    useGetObjectAvailability(objectType, objectUid, { language });
  const { isOver, setNodeRef } = useDroppable({
    id: DROPPABLE_ID,
  });

  useEffect(() => {
    // TODO shouldn't need
    if (availability === null && data) {
      console.log("here", data);
      // setAvailability(data);
    }
  }, [availability, data, setAvailability]);

  console.log({ availability });

  if (showDropArea)
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          isOver && "border-primary text-primary",
          "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-manatee-400",
        )}
      >
        <span>{`Drop object here to add to the ${objectType}'s content`}</span>
      </div>
    );

  return (
    <PanelSectionLayout
      sections={[{ id: "availability-panel-title", title: "Availability" }]}
      isPage={isPage}
    >
      {data && availability && (
        <>
          <PanelSectionTitle
            text={formatObjectField("Availability")}
            id={"availability-panel-title"}
          />
          {!isLoading && data?.length === 0 && <PanelEmptyDataText />}
          {availability?.map((obj) => {
            console.log("hey teacher", obj);
            return (
              <Fragment key={obj.uid}>
                <div className="flex items-center ">
                  <ObjectIdentifierCard
                    key={obj.uid}
                    object={obj}
                    disableForwardClick={inEditMode}
                    onForwardClick={setPanelObject}
                  >
                    {inEditMode && (
                      <span
                        className={
                          "flex h-6 min-w-6 items-center justify-center rounded-full bg-success px-1 pb-0.5 text-center text-white transition-colors"
                        }
                      />
                    )}
                    <button
                      disabled={!inEditMode}
                      onClick={() => console.log("")}
                    >
                      <Trash
                        className={clsx(
                          "ml-2 flex h-6 text-manatee-500 transition-all hover:text-error",
                          inEditMode ? "w-6" : "w-0",
                        )}
                      />
                    </button>
                  </ObjectIdentifierCard>
                </div>
              </Fragment>
            );
          })}
          {data?.map((obj) => {
            const { status, neverExpires } = obj;
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
                key: "start",
                value: formatReadableDate(obj.start),
              },
              {
                label: "End",
                key: "end",
                value: neverExpires ? "Never" : formatReadableDate(obj.end),
              },
              {
                label: "Timezone",
                key: "timezone",
                value: obj.timezone || "",
              },
            ];
            return (
              <div
                key={obj.uid}
                className={clsx(
                  "my-2 max-w-xl border border-l-4 py-4 px-4",
                  status === AvailabilityStatus.Active && "border-l-success",
                  status === AvailabilityStatus.Expired && "border-l-error",
                  status === AvailabilityStatus.Future && "border-l-warning",
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

                  <div className="flex items-center justify-center space-x-2">
                    {obj.status && <AvailabilityLabel status={obj.status} />}
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
              </div>
            );
          })}
        </>
      )}
      <PanelLoading
        isLoading={isLoading || hasNextPage}
        loadMore={() => fetchNextPage()}
      />
      <DisplayGraphQLQuery
        label="Get Object Availability"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
      {inEditMode && (
        <p className="w-full py-4 text-center text-sm text-manatee-600">
          {"Drag an object from the Content Library to add as relationship"}
        </p>
      )}
    </PanelSectionLayout>
  );
};
