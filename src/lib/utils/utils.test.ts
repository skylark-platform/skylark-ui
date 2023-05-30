import { ParsedSkylarkObject } from "src/interfaces/skylark";

import {
  createAccountIdentifier,
  formatObjectField,
  getObjectDisplayName,
  getPrimaryKeyField,
  hasProperty,
  isObject,
  isObjectsDeepEqual,
  pause,
} from "./utils";

describe("hasProperty", () => {
  test("returns true when the object has the property", () => {
    const got = hasProperty({ key: 1 }, "key");
    expect(got).toBeTruthy();
  });

  test("returns false when the object does not have the property", () => {
    const got = hasProperty({ key: 1 }, "no");
    expect(got).toBeFalsy();
  });
});

describe("isObject", () => {
  test("returns true when the given value is an object", () => {
    const got = isObject({});
    expect(got).toBeTruthy();
  });

  test("returns false when the given value is an array", () => {
    const got = isObject([]);
    expect(got).toBeFalsy();
  });

  test("returns false when the given value is a string", () => {
    const got = isObject("str");
    expect(got).toBeFalsy();
  });
});

describe("pause", () => {
  test("pauses for 1000ms", async () => {
    // Arrange
    jest.useFakeTimers();
    const cb = jest.fn();

    // Act
    pause(1000).then(cb);
    jest.advanceTimersByTime(1000);
    await Promise.resolve(); // allow any pending jobs in the PromiseJobs queue to run

    // Assert
    expect(cb).toHaveBeenCalled();
  });
});

describe("formatObjectField", () => {
  test("tests the case and _ change", () => {
    const got = formatObjectField("title_short");
    expect(got).toEqual("Title short");
  });

  test("tests uid -> UID (special case)", () => {
    const got = formatObjectField("uid");
    expect(got).toEqual("UID");
  });

  test("empty string when undefined is given", () => {
    const got = formatObjectField(undefined);
    expect(got).toEqual("");
  });
});

describe("getPrimaryKeyField", () => {
  test("uses the displayField when given in object config", () => {
    const object = {
      config: {
        primaryField: "title_short",
      },
      metadata: {
        title_short: "Short title",
        title: "default",
        uid: "uid",
        external_id: "external_id",
        slug: "slug",
      },
    } as unknown as ParsedSkylarkObject;
    const got = getPrimaryKeyField(object);
    expect(got).toEqual("title_short");
  });

  test("uses display name priority when primaryField is null", () => {
    const object = {
      config: {
        primaryField: null,
      },
      metadata: {
        title: "default",
        uid: "uid",
        external_id: "external_id",
        slug: "slug",
      },
    } as unknown as ParsedSkylarkObject;
    const got = getPrimaryKeyField(object);
    expect(got).toEqual("title");
  });

  test("defaults to uid", () => {
    const object = {
      metadata: {
        uid: "uid",
      },
    } as unknown as ParsedSkylarkObject;
    const got = getPrimaryKeyField(object);
    expect(got).toEqual("uid");
  });
});

describe("getObjectDisplayName", () => {
  test("gets the display name", () => {
    const object = {
      config: {
        primaryField: "title_short",
      },
      metadata: {
        title_short: "Short title",
        title: "default",
        uid: "uid",
        external_id: "external_id",
        slug: "slug",
      },
    } as unknown as ParsedSkylarkObject;
    const got = getObjectDisplayName(object);
    expect(got).toEqual("Short title");
  });

  test("defaults to uid", () => {
    const object = {
      config: {
        primaryField: null,
      },
      metadata: {
        uid: "xxx",
      },
    } as unknown as ParsedSkylarkObject;
    const got = getObjectDisplayName(object);
    expect(got).toEqual("xxx");
  });

  test("returns empty string when object is null", () => {
    const got = getObjectDisplayName(null);
    expect(got).toEqual("");
  });
});

describe("createAccountIdentifier", () => {
  test("creates an account identifier using a GraphQL URI", async () => {
    const got = createAccountIdentifier(
      "https://api.saas-sl-develop-10.skylark-dev.skylarkplatform.com/graphql",
    );
    expect(got).toEqual(
      "api-saas-sl-develop-10-skylark-dev-skylarkplatform-com",
    );
  });
});

describe("isObjectsDeepEqual", () => {
  test("marks two empty objects as the same", () => {
    const got = isObjectsDeepEqual({}, {});
    expect(got).toEqual(true);
  });

  test("objects with different numbers of keys are different", () => {
    const got = isObjectsDeepEqual(
      { key1: "true" },
      { key2: true, key3: true },
    );
    expect(got).toEqual(false);
  });

  test("objects with different values are different", () => {
    const got = isObjectsDeepEqual({ key1: "true" }, { key1: "false" });
    expect(got).toEqual(false);
  });

  test("objects with arrays as values are different", () => {
    const got = isObjectsDeepEqual({ key1: [1, 2, 3] }, { key1: [2, 3, 4] });
    expect(got).toEqual(false);
  });

  test("objects with arrays of different lengths as values are different", () => {
    const got = isObjectsDeepEqual({ key1: [1, 2, 3] }, { key1: [2] });
    expect(got).toEqual(false);
  });

  test("objects with arrays as values are same", () => {
    const got = isObjectsDeepEqual({ key1: [1, 2, 3] }, { key1: [1, 2, 3] });
    expect(got).toEqual(true);
  });

  test("objects with arrays of objects as values are same", () => {
    const got = isObjectsDeepEqual(
      { key1: [{ obj: 1 }, { test: "test" }] },
      { key1: [{ obj: 1 }, { test: "test" }] },
    );
    expect(got).toEqual(true);
  });

  test("objects with arrays in different orders as values are different", () => {
    const got = isObjectsDeepEqual({ key1: [1, 2, 3] }, { key1: [2, 3, 1] });
    expect(got).toEqual(false);
  });
});
