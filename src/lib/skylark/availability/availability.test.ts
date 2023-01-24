import dayjs from "dayjs";

import {
  AvailabilityStatus,
  ParsedSkylarkObjectAvailability,
} from "src/interfaces/skylark";

import {
  getObjectAvailabilityStatus,
  getSingleAvailabilityStatus,
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
