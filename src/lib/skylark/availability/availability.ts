import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  ParsedSkylarkObjectAvailability,
  AvailabilityStatus,
  ParsedSkylarkObjectMetadata,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export const getSingleAvailabilityStatus = (
  now: dayjs.Dayjs,
  start: string,
  end: string,
): ParsedSkylarkObjectAvailability["status"] => {
  if (now.isAfter(end)) {
    return AvailabilityStatus.Expired;
  }

  return now.isBefore(start)
    ? AvailabilityStatus.Future
    : AvailabilityStatus.Active;
};

export const getAvailabilityStatusForAvailabilityObject = (
  metadata: ParsedSkylarkObjectMetadata,
): ParsedSkylarkObjectAvailability["status"] => {
  const start = hasProperty(metadata, "start")
    ? (metadata.start as string)
    : "";
  const end = hasProperty(metadata, "end") ? (metadata.end as string) : "";

  if (!start && !end) {
    return AvailabilityStatus.Unavailable;
  }

  return getSingleAvailabilityStatus(dayjs(), start, end);
};

export const getObjectAvailabilityStatus = (
  availabilityObjects: ParsedSkylarkObjectAvailability["objects"],
): ParsedSkylarkObjectAvailability["status"] => {
  if (availabilityObjects.length === 0) {
    return AvailabilityStatus.Unavailable;
  }

  const now = dayjs();

  const nonExpiredAvailability = availabilityObjects.filter(({ end }) =>
    now.isBefore(end),
  );

  if (nonExpiredAvailability.length === 0) {
    return AvailabilityStatus.Expired;
  }

  const isFuture = nonExpiredAvailability.every(({ start }) =>
    now.isBefore(start),
  );

  return isFuture ? AvailabilityStatus.Future : AvailabilityStatus.Active;
};

export const formatReadableDate = (date?: string | null) =>
  date ? dayjs(date).format("llll") : "";

export const is2038Problem = (date: string) => {
  return dayjs(date).isSame("2038-01-19T03:14:07.000Z");
};

export const getRelativeTimeFromDate = (
  status: AvailabilityStatus,
  start: string,
  end: string,
): string => {
  if (status === AvailabilityStatus.Future) {
    return `Active ${dayjs(start).fromNow()}`;
  }
  if (status === AvailabilityStatus.Active) {
    const neverExpires = is2038Problem(end);
    if (neverExpires) {
      return "Never expires";
    }
    return `Expires ${dayjs(end).fromNow()}`;
  }
  return `Expired ${dayjs(end).fromNow()}`;
};
