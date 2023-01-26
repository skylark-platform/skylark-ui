import dayjs from "dayjs";

import {
  ParsedSkylarkObjectAvailability,
  AvailabilityStatus,
} from "src/interfaces/skylark";

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
