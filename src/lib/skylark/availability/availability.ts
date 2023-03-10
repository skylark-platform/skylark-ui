import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

import {
  ParsedSkylarkObjectAvailability,
  AvailabilityStatus,
} from "src/interfaces/skylark";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);

export const offsetAvailabilityByTimeZone = (
  start: string,
  end: string,
  timezone = "00:00",
) => {
  const offsetStart = dayjs.utc(start).utcOffset(timezone);
  const offsetEnd = dayjs.utc(end).utcOffset(timezone);
  console.log(offsetStart.format(), offsetEnd.format());
  return {
    offsetStart,
    offsetEnd,
  };
};

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
    return `Active ${dayjs(start).utc().fromNow()}`;
  }
  if (status === AvailabilityStatus.Active) {
    const neverExpires = is2038Problem(end);
    if (neverExpires) {
      return "Never expires";
    }
    return `Expires ${dayjs(end).utc().fromNow()}`;
  }
  return `Expired ${dayjs(end).utc().fromNow()}`;
};
