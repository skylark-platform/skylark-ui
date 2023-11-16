import dayjs from "dayjs";

import { UTC_NAME } from "src/components/inputs/select";
import {
  AvailabilityStatus,
  ParsedSkylarkObjectAvailability,
} from "src/interfaces/skylark";

import {
  getObjectAvailabilityStatus,
  getSingleAvailabilityStatus,
  getRelativeTimeFromDate,
  is2038Problem,
  convertDateAndTimezoneToISO,
} from "./availability";

const now = dayjs();
const yesterday = now.subtract(1, "day").toISOString();
const tomorrow = now.add(1, "day").toISOString();

describe("getSingleAvailabilityStatus", () => {
  test("returns Expired when the availability end was yesterday", () => {
    const got = getSingleAvailabilityStatus(now, "", yesterday);
    expect(got).toEqual(AvailabilityStatus.Expired);
  });

  test("returns Active when the start is in the past", () => {
    const got = getSingleAvailabilityStatus(now, yesterday, "");
    expect(got).toEqual(AvailabilityStatus.Active);
  });

  test("returns Future when the start is in the future", () => {
    const got = getSingleAvailabilityStatus(now, tomorrow, "");
    expect(got).toEqual(AvailabilityStatus.Future);
  });
});

describe("getObjectAvailabilityStatus", () => {
  const obj: ParsedSkylarkObjectAvailability["objects"][0] = {
    uid: "1",
    start: "",
    end: "",
    timezone: "",
    external_id: "",
    title: "",
    slug: "",
    inherited: {
      from: "",
      via: "",
    },
    dimensions: [],
  };

  test("returns Unavailable when the object has no availabilities", () => {
    const got = getObjectAvailabilityStatus([]);
    expect(got).toEqual(AvailabilityStatus.Unavailable);
  });

  test("returns Expired when all object's ends are in the past", () => {
    const got = getObjectAvailabilityStatus([
      {
        ...obj,
        end: yesterday,
      },
    ]);
    expect(got).toEqual(AvailabilityStatus.Expired);
  });

  test("returns Future when all object's start are in the future", () => {
    const got = getObjectAvailabilityStatus([
      {
        ...obj,
        start: tomorrow,
        end: tomorrow,
      },
    ]);
    expect(got).toEqual(AvailabilityStatus.Future);
  });

  test("returns Active when all object's start is in the past, but the end is in the future", () => {
    const got = getObjectAvailabilityStatus([
      {
        ...obj,
        start: yesterday,
        end: tomorrow,
      },
    ]);
    expect(got).toEqual(AvailabilityStatus.Active);
  });

  test("returns Future when all object's are either Expired or Future", () => {
    const got = getObjectAvailabilityStatus([
      {
        ...obj,
        end: yesterday,
      },
      {
        ...obj,
        start: tomorrow,
        end: tomorrow,
      },
    ]);
    expect(got).toEqual(AvailabilityStatus.Future);
  });

  test("returns Active when all object's are either Expired, Future or Active", () => {
    const got = getObjectAvailabilityStatus([
      {
        ...obj,
        end: yesterday,
      },
      {
        ...obj,
        start: tomorrow,
        end: tomorrow,
      },
      {
        ...obj,
        start: yesterday,
        end: tomorrow,
      },
    ]);
    expect(got).toEqual(AvailabilityStatus.Active);
  });
});

describe("is2038Problem", () => {
  test("returns true when the date is the 2038 problem", () => {
    const got = is2038Problem("2038-01-19T03:14:07.000Z");
    expect(got).toBeTruthy();
  });

  test("returns false when the date is not the 2038 problem", () => {
    const got = is2038Problem("2038-01-19T03:14:06.000Z");
    expect(got).toBeFalsy();
  });
});

describe("getRelativeTimeFromDate", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z"));
  });

  test("future time window", () => {
    const got = getRelativeTimeFromDate(
      AvailabilityStatus.Future,
      "2024-01-19T03:14:07.000Z",
      "2038-01-19T03:14:07.000Z",
    );
    expect(got).toEqual("Active in a year");
  });

  test("active time window", () => {
    const got = getRelativeTimeFromDate(
      AvailabilityStatus.Active,
      "2020-01-19T03:14:07.000Z",
      "2028-01-19T03:14:07.000Z",
    );
    expect(got).toEqual("Expires in 5 years");
  });

  test("active time window that never expires (2038 problem)", () => {
    const got = getRelativeTimeFromDate(
      AvailabilityStatus.Active,
      "2020-01-19T03:14:07.000Z",
      "2038-01-19T03:14:07.000Z",
    );
    expect(got).toEqual("Never expires");
  });

  test("expired time window", () => {
    const got = getRelativeTimeFromDate(
      AvailabilityStatus.Expired,
      "2020-01-19T03:14:07.000Z",
      "2022-01-19T03:14:07.000Z",
    );
    expect(got).toEqual("Expired a year ago");
  });
});

describe("convertDateAndTimezoneToISO", () => {
  const date = "2022-07-30T12:30:00";

  test("converts the given date to the timezone (UTC)", () => {
    const got = convertDateAndTimezoneToISO(date, UTC_NAME);
    expect(got).toEqual("2022-07-30T12:30:00.000Z");
  });

  test("converts the given date to the timezone (London in Summer time)", () => {
    const got = convertDateAndTimezoneToISO(date, "Europe/London");
    expect(got).toEqual("2022-07-30T11:30:00.000Z");
  });

  test("converts the given date to the timezone (London in Winter time)", () => {
    const got = convertDateAndTimezoneToISO(
      "2022-12-30T12:30:00",
      "Europe/London",
    );
    expect(got).toEqual("2022-12-30T12:30:00.000Z");
  });
});
