import { formatObjectField, formatUriAsCustomerIdentifer } from "./format";

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

describe("formatUriAsCustomerIdentifer", () => {
  test("return empty string when given empty string", () => {
    const got = formatUriAsCustomerIdentifer("");
    expect(got).toEqual("");
  });

  test("return empty string when a non skylark URL is given", () => {
    const got = formatUriAsCustomerIdentifer("https://google.com");
    expect(got).toEqual("");
  });

  test("formats and adds int identifier when the url is an int environment one", () => {
    const got = formatUriAsCustomerIdentifer(
      "https://my-test.api.int.development.skylarkplatform.com/graphql",
    );
    expect(got).toEqual("My test (int)");
  });

  test("formats production url", () => {
    const got = formatUriAsCustomerIdentifer(
      "https://my-test.api.skylarkplatform.com/graphql",
    );
    expect(got).toEqual("My test");
  });

  test("falls back to taking the second path parameter", () => {
    const got = formatUriAsCustomerIdentifer(
      "https://ignore.my-test.skylarkplatform.io/graphql",
    );
    expect(got).toEqual("My test");
  });
});
