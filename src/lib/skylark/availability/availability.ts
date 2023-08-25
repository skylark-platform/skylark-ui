import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import {
  ParsedSkylarkObjectAvailability,
  AvailabilityStatus,
  ParsedSkylarkObjectMetadata,
  SkylarkAvailabilityField,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

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
  const start = hasProperty(metadata, SkylarkAvailabilityField.Start)
    ? (metadata.start as string)
    : "";
  const end = hasProperty(metadata, SkylarkAvailabilityField.End)
    ? (metadata.end as string)
    : "";

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

export const convertToUTCDate = (date: string, offset: string | null) => {
  // console.log({ date, offset });
  if (offset) {
    const parsedFieldValueWithZRemoved = date.toUpperCase().endsWith("Z")
      ? date.slice(0, -1)
      : date;
    return `${parsedFieldValueWithZRemoved}${offset}`;
  }

  const utcDate = dayjs(date).utc().format();
  return utcDate;
};

export const convertDateAndTimezoneToISO = (str: string, timezone: string) => {
  const strWithoutTz = dayjs(str).format("YYYY-MM-DDTHH:mm:ss");
  const date = dayjs.tz(strWithoutTz, timezone);

  console.log("convertDateAndTimezoneToISO", {
    d: date.format(),
    withoutTZ: strWithoutTz,
    str,
    timezone,
  });

  return date.toISOString();
};
