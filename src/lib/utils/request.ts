import { REQUEST_HEADERS } from "src/constants/skylark";
import { convertDateAndTimezoneToISO } from "src/lib/skylark/availability";

import { convertSlugToDimensionHeader } from "./utils";

const convertAvailabilityDimensionsObjectToGQLDimensionHeaders = (
  availabilityDimensions: Record<string, string> | null,
) => {
  if (!availabilityDimensions) {
    return [];
  }

  const dimensions = Object.entries(availabilityDimensions).reduce(
    (prev, [dimension, value]) => ({
      ...prev,
      [convertSlugToDimensionHeader(dimension)]: value,
    }),
    {},
  );

  return dimensions;
};

export const generateAvailabilityHeaders = (availability?: {
  dimensions: Record<string, string> | null;
  timeTravel: {
    datetime: string;
    timezone: string;
  } | null;
}) => {
  // TODO convert this into generic function as its duplicated in search
  let headers: HeadersInit = {
    [REQUEST_HEADERS.ignoreAvailability]: "true",
  };

  if (!availability) {
    return headers;
  }

  if (availability.dimensions) {
    headers = {
      ...headers,
      ...convertAvailabilityDimensionsObjectToGQLDimensionHeaders(
        availability.dimensions,
      ),
      [REQUEST_HEADERS.ignoreAvailability]: "false",
    };

    if (!availability.timeTravel) {
      headers[REQUEST_HEADERS.ignoreTime] = "true";
    }
  }

  // TODO should this be improved to handle both when dimensions are not given AND when an account has no dimensions?
  if (availability.timeTravel) {
    headers[REQUEST_HEADERS.ignoreAvailability] = "false";
    headers[REQUEST_HEADERS.ignoreTime] = "false";
    // Send as UTC
    headers[REQUEST_HEADERS.timeTravel] = convertDateAndTimezoneToISO(
      availability.timeTravel.datetime,
      availability.timeTravel.timezone,
    );
  }

  return headers;
};
