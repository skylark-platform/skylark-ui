import dayjs from "dayjs";

import {
  ParsedSkylarkObjectAvailability,
  ParsedSkylarkObjectAvailabilityStatus,
} from "src/interfaces/skylark";

export const getObjectAvailabilityStatus = (
  availabilityObjects: ParsedSkylarkObjectAvailability["objects"],
): ParsedSkylarkObjectAvailability["status"] => {
  if (availabilityObjects.length === 0) {
    return ParsedSkylarkObjectAvailabilityStatus.Unavailable;
  }

  const now = dayjs();

  const nonExpiredAvailability = availabilityObjects.filter(({ end }) =>
    now.isBefore(end),
  );

  if (nonExpiredAvailability.length === 0) {
    return ParsedSkylarkObjectAvailabilityStatus.Expired;
  }

  const isFuture = nonExpiredAvailability.every(({ start }) =>
    now.isBefore(start),
  );

  return isFuture
    ? ParsedSkylarkObjectAvailabilityStatus.Future
    : ParsedSkylarkObjectAvailabilityStatus.Active;
};
