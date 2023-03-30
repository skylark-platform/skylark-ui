import clsx from "clsx";
import { Fragment } from "react";

import { AvailabilityLabel } from "src/components/availability";
import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useGetObjectAvailability } from "src/hooks/useGetObjectAvailability";
import {
  AvailabilityStatus,
  SkylarkGraphQLAvailabilityDimension,
  ParsedSkylarkObjectAvailabilityObject,
} from "src/interfaces/skylark";
import {
  formatReadableDate,
  getRelativeTimeFromDate,
} from "src/lib/skylark/availability";
import { formatObjectField } from "src/lib/utils";

interface PanelAvailabilityProps {
  objectType: string;
  objectUid: string;
  language: string;
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
  objectType,
  objectUid,
  language,
}: PanelAvailabilityProps) => {
  const { data, hasNextPage, isLoading, fetchNextPage, query, variables } =
    useGetObjectAvailability(objectType, objectUid, { language });
  return (
    <div className="relative flex h-full flex-col overflow-y-auto p-4 pb-12 text-sm md:p-8">
      {data && (
        <>
          <PanelSectionTitle text={formatObjectField("Availability")} />
          {!isLoading && data?.length === 0 && <PanelEmptyDataText />}
          {data.map((obj) => {
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
              { label: "Timezone", key: "timezone", value: obj.timezone || "" },
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
                <div className="flex">
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

                  {obj.status && <AvailabilityLabel status={obj.status} />}
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
    </div>
  );
};
