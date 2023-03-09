import clsx from "clsx";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Fragment } from "react";
import { InView } from "react-intersection-observer";

import { AvailabilityLabel } from "src/components/availability";
import { Spinner } from "src/components/icons";
import { PanelLoading } from "src/components/panel/panelLoading";
import { useGetObjectAvailability } from "src/hooks/useGetObjectAvailability";
import {
  ParsedSkylarkObjectAvailability,
  AvailabilityStatus,
  SkylarkGraphQLAvailabilityDimension,
} from "src/interfaces/skylark";
import { getTimeFromDate } from "src/lib/skylark/availability";

dayjs.extend(localizedFormat);

interface PanelAvailabilityProps {
  objectType: string;
  objectUid: string;
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
        <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 break-words text-base-content">
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
}: PanelAvailabilityProps) => {
  const { data, hasNextPage, isLoading, fetchNextPage } =
    useGetObjectAvailability(objectType, objectUid);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 pb-12 text-sm md:p-8">
      {data?.map((obj) => {
        const { status, neverExpires } = obj;
        const availabilityInfo: {
          key: keyof Omit<
            ParsedSkylarkObjectAvailability["objects"][0],
            "dimensions"
          >;
          label: string;
          value: string;
        }[] = [
          {
            label: "Start",
            key: "start",
            value: dayjs(obj.start).format("llll"),
          },
          {
            label: "End",
            key: "end",
            value: neverExpires ? "Never" : dayjs(obj.end).format("llll"),
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
                <h3 className="text-base font-bold">
                  {obj.title || obj.slug || obj.external_id || obj.uid}
                </h3>
                <p className="text-manatee-400">
                  {status &&
                    getTimeFromDate(status, obj.start || "", obj.end || "")}
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
      <PanelLoading
        isLoading={isLoading || hasNextPage}
        loadMore={() => fetchNextPage()}
      />
    </div>
  );
};
