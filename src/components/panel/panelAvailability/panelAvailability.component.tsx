import clsx from "clsx";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";

import {
  ObjectAvailability,
  ObjectAvailabilityStatus,
} from "src/interfaces/skylark/objects";

dayjs.extend(LocalizedFormat);

interface PanelAvailabilityProps {
  availability: ObjectAvailability;
}

export const getSingleAvailabilityStatus = (
  now: dayjs.Dayjs,
  start: string,
  end: string,
): ObjectAvailability["status"] => {
  if (now.isAfter(end)) {
    return ObjectAvailabilityStatus.Expired;
  }

  return now.isBefore(start)
    ? ObjectAvailabilityStatus.Future
    : ObjectAvailabilityStatus.Active;
};

export const PanelAvailability = ({ availability }: PanelAvailabilityProps) => {
  const info: {
    label: string;
    key: keyof Omit<ObjectAvailability["objects"][0], "dimensions">;
  }[] = [
    { label: "Start", key: "start" },
    { label: "End", key: "end" },
    { label: "Timezone", key: "timezone" },
    // { label: "Slug", key: "slug" },
    // { label: "External ID", key: "external_id" },
  ];

  const now = dayjs();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      {availability.objects.map((obj) => {
        const status = getSingleAvailabilityStatus(now, obj.start, obj.end);
        return (
          <div
            key={obj.slug}
            className={clsx(
              "rounded-lg border-2 p-4 shadow",
              status === ObjectAvailabilityStatus.Active && "border-success",
              status === ObjectAvailabilityStatus.Expired && "border-error",
              status === ObjectAvailabilityStatus.Future && "border-warning",
            )}
          >
            <h3 className="font-bold">
              {obj.title || obj.slug || obj.external_id || obj.uid}
              <span className="ml-1 font-normal">{`(${status})`}</span>
            </h3>
            <p className="text-manatee-300">{`UID: ${obj.uid}`}</p>
            <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-4 break-words pt-4 text-base-content">
              {info.map(({ label, key }) => (
                <>
                  <span>{`${label}:`}</span>
                  <span className="">
                    {["start", "end"].includes(key)
                      ? dayjs(obj[key]).format("LLLL")
                      : obj[key]}
                  </span>
                </>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};