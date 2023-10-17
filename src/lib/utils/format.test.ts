import { formatObjectField } from "./format";

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
