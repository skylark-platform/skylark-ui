import { hasProperty, isObject } from "./utils";

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
